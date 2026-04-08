const InventoryService = require('../services/InventoryService');

exports.getIngredients = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const data = await InventoryService.getAllIngredients({ page: +page, limit: +limit });
  res.json(data);
};

exports.editIngredients = async (req, res) => {
  const data = await InventoryService.editIngredient(req.body);
  res.status(201).json(data);
};

exports.addIngredient = async (req, res) => {
  const { name, unit, currentStock, minThreshold } = req.body;
  if (!name, !unit, !currentStock) {
    return res.status(400).json({ success: false, message: "invalid data" });

  }
  const data = await InventoryService.addIngredient({ name, unit: unit.toLowerCase(), currentStock, minThreshold });
  res.status(201).json(data);
};


exports.getRecipe = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const data = await InventoryService.getAllRecipes({ page: +page, limit: +limit });
  res.json(data);
};

exports.addRecipe = async (req, res) => {
  const { name, ingredientsMap } = req.body;
  if (!name, ingredientsMap.length < 1) {
    return res.status(400).json({ success: false, message: "invalid data" });

  }
  const data = await InventoryService.createRecipe(name, ingredientsMap);
  res.status(201).json(data);
};


exports.prepareDish = async (req, res) => {
  try {
    const { recipe_id, items } = req.body;
    const result = recipe_id
      ? await InventoryService.recordConsumption(recipe_id, items)
      : {success: true};
    res.json({ message: "Stock deducted successfully", result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.servedDishes = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await InventoryService.getConsumptionLogs({ page: +page, limit: +limit });
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.logWaste = async (req, res) => {
  const { ingredientId, quantity, reason } = req.body;
  const result = await InventoryService.recordWaste(ingredientId, quantity, reason);
  res.json(result);
};

exports.getLogWaste = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const result = await InventoryService.getWasteLogs({ page: +page, limit: +limit });
  res.json(result);
};

exports.getDashboard = async (req, res) => {
  try {
    const stats = await InventoryService.getDashboardStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};