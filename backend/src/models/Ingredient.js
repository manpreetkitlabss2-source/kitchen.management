// src/models/Ingredient.js
const mongoose = require('mongoose');
const ingredientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  unit: { type: String, enum: ['kg', 'liters', 'pieces', 'grams', 'ml'], required: true },
  current_stock: { type: Number, default: 0 },
  threshold_value: { type: Number, default: 10 } // For low stock alerts
});
module.exports = mongoose.model('Ingredient', ingredientSchema);
