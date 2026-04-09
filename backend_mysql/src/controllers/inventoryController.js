const InventoryService = require('../services/InventoryService');

exports.getIngredients = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const user_id = req.user.userId;
    const data = await InventoryService.getAllIngredients({ page: +page, limit: +limit, user_id });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.addIngredient = async (req, res) => {
  try {
    const { name, unit, currentStock, minThreshold, current_stock, threshold_value } = req.body;
    const stock = current_stock ?? currentStock;
    const threshold = threshold_value ?? minThreshold;
    if (!name || !unit || stock === undefined) {
      return res.status(400).json({ success: false, message: 'invalid data' });
    }
    const data = await InventoryService.addIngredient({
      name,
      unit: unit.toLowerCase(),
      current_stock: stock,
      threshold_value: threshold,
      user_id: req.user.userId
    });
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.editIngredients = async (req, res) => {
  try {
    const data = await InventoryService.editIngredient(req.body, req.user.userId);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getRecipe = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const data = await InventoryService.getAllRecipes({ page: +page, limit: +limit, user_id: req.user.userId });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.addRecipe = async (req, res) => {
  try {
    const { name, ingredientsMap, ingredients } = req.body;
    const items = ingredients || ingredientsMap;
    if (!name || !items || items.length < 1) {
      return res.status(400).json({ success: false, message: 'invalid data' });
    }
    const normalized = items.map(item => ({
      ingredient_id: item.ingredient_id || item.ingredientid || item.ingredientId,
      quantity_required: item.quantity_required || item.quantity
    }));
    const data = await InventoryService.createRecipe(name, normalized, req.user.userId);
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.prepareDish = async (req, res) => {
  try {
    const { recipe_id, items } = req.body;
    const result = recipe_id
      ? await InventoryService.recordConsumption(recipe_id, items, req.user.userId)
      : { success: true };
    res.json({ message: 'Stock deducted successfully', result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.servedDishes = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await InventoryService.getConsumptionLogs({ page: +page, limit: +limit, user_id: req.user.userId });
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.logWaste = async (req, res) => {
  try {
    const { ingredient_id, ingredientId, quantity, reason } = req.body;
    const id = ingredient_id || ingredientId;
    const result = await InventoryService.recordWaste(id, quantity, reason, req.user.userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getLogWaste = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await InventoryService.getWasteLogs({ page: +page, limit: +limit, user_id: req.user.userId });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDashboard = async (req, res) => {
  try {
    const stats = await InventoryService.getDashboardStats(req.user.userId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
