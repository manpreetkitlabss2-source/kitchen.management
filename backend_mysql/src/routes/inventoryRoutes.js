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
router.delete('/ingredients/:id', authorize('inventory:write'), invCtrl.deleteIngredient);

// Recipes
router.get('/recipe',       authorize('recipe:read'),  invCtrl.getRecipe);
router.post('/recipe',      authorize('recipe:write'), invCtrl.addRecipe);
router.delete('/recipe/:id', authorize('recipe:write'), invCtrl.deleteRecipe);

// Consumption
router.get('/consumption',         authorize('consumption:read'),   invCtrl.servedDishes);
router.post('/consumption/prepare', authorize('consumption:create'), invCtrl.prepareDish);

// Waste
router.get('/waste',  authorize('waste:read'),   invCtrl.getLogWaste);
router.post('/waste', authorize('waste:create'), invCtrl.logWaste);

// Dashboard
router.get('/dashboard', authorize('dashboard:read'), invCtrl.getDashboard);

// Orders
router.get('/orders',  authorize('order:read'),   invCtrl.getOrders);
router.post('/orders', authorize('order:create'), invCtrl.placeOrder);

module.exports = router;
