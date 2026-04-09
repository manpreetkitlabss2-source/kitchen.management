const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// Public routes
router.post('/signup', authController.signup);
router.post('/login', authController.login);

// Example of a protected route for future inventory APIs
// router.get('/inventory', protect, isAdmin, inventoryController.getData);

module.exports = router;