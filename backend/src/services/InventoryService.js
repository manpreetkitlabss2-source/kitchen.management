const Ingredient = require('../models/Ingredient');
const Recipe = require('../models/Recipe');
const Log = require('../models/Logs');
const { default: mongoose } = require('mongoose');

class InventoryService {
  // --- Ingredient Logic ---
  async addIngredient(data) {
    return await Ingredient.create(data);
  }

  async editIngredient(data) {
    const { _id, ...updateData } = data;

    if (!_id) {
      throw new Error("Ingredient ID (_id) is required for update");
    }

    // Remove undefined values to prevent unwanted updates
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    if (Object.keys(updateData).length === 0) {
      throw new Error("No valid fields provided for update");
    }

    return await Ingredient.findByIdAndUpdate(
      _id,
      updateData,
      {
        returnDocument: 'after',   // ← This replaces the deprecated { new: true }
        runValidators: true
      }
    );
  }

  async getAllIngredients({ page = 1, limit = 10 } = {}) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Ingredient.find().skip(skip).limit(limit).lean(),
      Ingredient.countDocuments()
    ]);
    return { data, page, limit, total };
  }

  // --- Recipe Logic ---
  async createRecipe(name, ingredientsMap) {
    return await Recipe.create({ name, ingredients: ingredientsMap });
  }

  async getAllRecipes({ page = 1, limit = 10 } = {}) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Recipe.find().populate('ingredients.ingredient_id', 'name unit').skip(skip).limit(limit).lean(),
      Recipe.countDocuments()
    ]);
    return { data, page, limit, total };
  }
  // --- Consumption Logic (The Auto-Deduction Engine) ---
  async recordConsumption(recipeId, items = null) {
    const session = await mongoose.startSession();
    session.startTransaction();
    console.log()
    try {
      const recipe = await Recipe
        .findById(recipeId)
        .populate('ingredients.ingredient_id')
        .session(session);

      if (!recipe) {
        throw new Error("Recipe not found");
      }

      const logs = [];

      const itemMap = new Map(
        items.map(i => [
          i.ingredient_id.toString(),
          i.quantity_required
        ])
      );
      for (const item of recipe.ingredients) {
        const ingredient = item.ingredient_id;

        if (!ingredient) {
          throw new Error("Ingredient not found");
        }

        const qtyToDeduct =
          itemMap.get(
            ingredient._id.toString()
          ) ?? item.quantity_required;

        if (ingredient.current_stock === 0) {
          throw new Error(
            `${ingredient.name} is out of stock`
          );
        }

        if (ingredient.current_stock < qtyToDeduct) {
          throw new Error(
            `Not enough stock for ${ingredient.name}. Required: ${qtyToDeduct}, Available: ${ingredient.current_stock}`
          );
        }

        await Ingredient.findByIdAndUpdate(
          ingredient._id,
          {
            $inc: { current_stock: -qtyToDeduct }
          },
          { session }
        );

        logs.push({
          type: "consumption",
          ingredient_id: ingredient._id,
          recipe_id: recipeId,
          quantity: qtyToDeduct
        });
      }

      await Log.insertMany(logs, { session });

      await session.commitTransaction();
      session.endSession();

      return logs;

    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  async getConsumptionLogs({ page = 1, limit = 10 } = {}) {
    const skip = (page - 1) * limit;
    const filter = { type: 'consumption' };
    const [data, total] = await Promise.all([
      Log.find(filter)
        .populate('ingredient_id', 'name unit')
        .populate('recipe_id', 'name')
        .sort({ created_at: -1 })
        .skip(skip).limit(limit).lean(),
      Log.countDocuments(filter)
    ]);
    return { data, page, limit, total };
  }


  // --- Waste Logic ---
  async getWasteLogs({ page = 1, limit = 10 } = {}) {
    const skip = (page - 1) * limit;
    const filter = { type: 'waste' };
    const [data, total] = await Promise.all([
      Log.find(filter)
        .populate('ingredient_id', 'name unit')
        .sort({ created_at: -1 })
        .skip(skip).limit(limit).lean(),
      Log.countDocuments(filter)
    ]);
    return { data, page, limit, total };
  }

  async recordWaste(ingredientId, quantity, reason) {
    await Ingredient.findByIdAndUpdate(ingredientId, {
      $inc: { current_stock: -quantity }
    });
    return await Log.create({
      type: 'waste',
      ingredient_id: ingredientId,
      quantity,
      reason
    });
  }

  // --- Dashboard Analytics ---
  async getDashboardStats() {
    const [ingredientStats, logStats] = await Promise.all([
      // Single $facet over Ingredient collection
      Ingredient.aggregate([
        {
          $facet: {
            counts: [
              {
                $group: {
                  _id: null,
                  total: { $sum: 1 },
                  lowStock: {
                    $sum: {
                      $cond: [
                        { $and: [
                          { $gt: ['$current_stock', 0] },
                          { $lte: ['$current_stock', '$threshold_value'] }
                        ]},
                        1, 0
                      ]
                    }
                  },
                  outOfStock: {
                    $sum: { $cond: [{ $lte: ['$current_stock', 0] }, 1, 0] }
                  }
                }
              }
            ],
            lowStockItems: [
              { $match: { $expr: { $lte: ['$current_stock', '$threshold_value'] } } },
              { $sort: { current_stock: 1 } },
              { $limit: 5 },
              { $project: { name: 1, unit: 1, current_stock: 1, threshold_value: 1 } }
            ],
            topStock: [
              { $sort: { current_stock: -1 } },
              { $limit: 5 },
              { $project: { name: 1, current_stock: 1 } }
            ]
          }
        }
      ]),
      // Single $facet over Log collection
      Log.aggregate([
        {
          $facet: {
            consumptionTotal: [
              { $match: { type: 'consumption' } },
              { $group: { _id: null, total: { $sum: '$quantity' } } }
            ],
            wasteTotal: [
              { $match: { type: 'waste' } },
              { $group: { _id: null, total: { $sum: '$quantity' } } }
            ],
            topWaste: [
              { $match: { type: 'waste' } },
              { $group: { _id: '$ingredient_id', totalWaste: { $sum: '$quantity' } } },
              { $sort: { totalWaste: -1 } },
              { $limit: 5 },
              {
                $lookup: {
                  from: 'ingredients',
                  localField: '_id',
                  foreignField: '_id',
                  as: 'ingredient'
                }
              },
              { $unwind: { path: '$ingredient', preserveNullAndEmptyArrays: true } },
              { $project: { name: '$ingredient.name', totalWaste: 1 } }
            ]
          }
        }
      ])
    ]);

    const ing = ingredientStats[0];
    const logs = logStats[0];
    const counts = ing.counts[0] || { total: 0, lowStock: 0, outOfStock: 0 };

    return {
      summary: {
        totalIngredients: counts.total,
        lowStockCount: counts.lowStock,
        outOfStockCount: counts.outOfStock,
        totalConsumption: logs.consumptionTotal[0]?.total || 0,
        totalWaste: logs.wasteTotal[0]?.total || 0
      },
      counts: {
        ingredients: counts.total,
        lowStock: counts.lowStock,
        outOfStock: counts.outOfStock
      },
      recent: {
        lowStockItems: ing.lowStockItems,
        topWaste: logs.topWaste
      },
      metrics: {
        topStock: ing.topStock,
        consumptionTotal: logs.consumptionTotal[0]?.total || 0,
        wasteTotal: logs.wasteTotal[0]?.total || 0
      }
    };
  }
}

module.exports = new InventoryService();