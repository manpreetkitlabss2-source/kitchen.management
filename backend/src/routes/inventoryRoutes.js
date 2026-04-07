const express = require('express');
const router = express.Router();
const invCtrl = require('../controllers/inventoryController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// All routes here are protected for Admins
router.use(protect, isAdmin);

// Ingredients
router.get('/ingredients', invCtrl.getIngredients);
router.put('/ingredients', invCtrl.editIngredients);
router.post('/ingredients', invCtrl.addIngredient);


// Recipes & Consumption
router.post('/recipe', invCtrl.addRecipe);
router.get('/recipe', invCtrl.getRecipe);

// Recipes & Consumption
router.post('/consumption/prepare', invCtrl.prepareDish);
router.get('/consumption', invCtrl.servedDishes);

// Waste
router.get('/waste', invCtrl.getLogWaste);
router.post('/waste', invCtrl.logWaste);

// Dashboard
router.get('/dashboard', invCtrl.getDashboard);

module.exports = router;