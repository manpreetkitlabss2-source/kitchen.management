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

  async getAllIngredients() {
    return await Ingredient.find();
  }

  // --- Recipe Logic ---
  async createRecipe(name, ingredientsMap) {
    return await Recipe.create({ name, ingredients: ingredientsMap });
  }

  async getAllRecipes() {
    return await Recipe.find();
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

  async getConsumptionLogs() {
    return await Log.find().where({type: "consumption"});
  }


  // --- Waste Logic ---
  async getWasteLogs() {
    const result = await Log.find().where({type: "waste"});
    return result;
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
    const totalIngredients = await Ingredient.countDocuments();
    const lowStockItems = await Ingredient.find({
      $expr: { $lte: ["$current_stock", "$threshold_value"] }
    });

    // Aggregation for Waste
    const wasteReport = await Log.aggregate([
      { $match: { type: 'waste' } },
      { $group: { _id: '$ingredient_id', totalWaste: { $sum: '$quantity' } } },
      { $sort: { totalWaste: -1 } },
      { $limit: 5 }
    ]);

    return { totalIngredients, lowStockCount: lowStockItems.length, lowStockItems, wasteReport };
  }
}

module.exports = new InventoryService();