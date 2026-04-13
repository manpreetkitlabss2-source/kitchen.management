const InventoryService = require('../services/InventoryService');

exports.getIngredients = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const data = await InventoryService.getAllIngredients({ page: +page, limit: +limit, restaurant_id: req.user.restaurantId });
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
      user_id: req.user.userId,
      restaurant_id: req.user.restaurantId
    });
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.editIngredients = async (req, res) => {
  try {
    const data = await InventoryService.editIngredient(req.body, req.user.userId, req.user.restaurantId);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteIngredient = async (req, res) => {
  try {
    await InventoryService.deleteIngredient(req.params.id, req.user.restaurantId);
    res.json({ success: true });
  } catch (error) {
    res.status(error.message.includes('not found') ? 404 : 500).json({ error: error.message });
  }
};

exports.getRecipe = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const data = await InventoryService.getAllRecipes({ page: +page, limit: +limit, restaurant_id: req.user.restaurantId });
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
    const data = await InventoryService.createRecipe(name, normalized, req.user.userId, req.user.restaurantId);
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteRecipe = async (req, res) => {
  try {
    await InventoryService.deleteRecipe(req.params.id, req.user.restaurantId);
    res.json({ success: true });
  } catch (error) {
    res.status(error.message.includes('not found') ? 404 : 500).json({ error: error.message });
  }
};

exports.prepareDish = async (req, res) => {
  try {
    const { recipe_id, items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'At least one ingredient item is required.' });
    }

    const result = await InventoryService.recordConsumption(
      recipe_id || null,
      items,
      req.user.userId,
      req.user.restaurantId
    );

    res.json({ message: 'Stock deducted successfully', result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.servedDishes = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await InventoryService.getConsumptionLogs({ page: +page, limit: +limit, restaurant_id: req.user.restaurantId });
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.logWaste = async (req, res) => {
  try {
    const { ingredient_id, ingredientId, quantity, reason } = req.body;
    const id = ingredient_id || ingredientId;
    const result = await InventoryService.recordWaste(id, quantity, reason, req.user.userId, req.user.restaurantId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getLogWaste = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await InventoryService.getWasteLogs({ page: +page, limit: +limit, restaurant_id: req.user.restaurantId });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDashboard = async (req, res) => {
  try {
    const stats = await InventoryService.getDashboardStats(req.user.restaurantId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.placeOrder = async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'items are required' });
    }
    const result = await InventoryService.createOrder(items, req.user.userId, req.user.restaurantId);
    res.status(201).json({ message: 'Order placed successfully', result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await InventoryService.getOrders({ page: +page, limit: +limit, restaurant_id: req.user.restaurantId });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
