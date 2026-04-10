const express = require('express');
const router = express.Router();
const invCtrl = require('../controllers/inventoryController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');

// All routes require authentication
router.use(protect);

// Ingredients
router.get('/ingredients',  authorize('inventory:read'),  invCtrl.getIngredients);
router.post('/ingredients', authorize('inventory:write'), invCtrl.addIngredient);
router.put('/ingredients',  authorize('inventory:write'), invCtrl.editIngredients);

// Recipes
router.get('/recipe',  authorize('recipe:read'),  invCtrl.getRecipe);
router.post('/recipe', authorize('recipe:write'), invCtrl.addRecipe);

// Consumption
router.get('/consumption',         authorize('consumption:read'),   invCtrl.servedDishes);
router.post('/consumption/prepare', authorize('consumption:create'), invCtrl.prepareDish);

// Waste
router.get('/waste',  authorize('waste:read'),   invCtrl.getLogWaste);
router.post('/waste', authorize('waste:create'), invCtrl.logWaste);

// Dashboard
router.get('/dashboard', authorize('dashboard:read'), invCtrl.getDashboard);

module.exports = router;
