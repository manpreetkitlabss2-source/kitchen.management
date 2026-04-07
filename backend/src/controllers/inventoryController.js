const InventoryService = require('../services/InventoryService');

exports.getIngredients = async (req, res) => {
  const data = await InventoryService.getAllIngredients();
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
  const data = await InventoryService.getAllRecipes();
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
    const result = await InventoryService.getConsumptionLogs();
    res.json({ message: "successfull", result });
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
  const result = await InventoryService.getWasteLogs();
  res.json(result);
};

exports.getDashboard = async (req, res) => {
  const stats = await InventoryService.getDashboardStats();
  res.json(stats);
};