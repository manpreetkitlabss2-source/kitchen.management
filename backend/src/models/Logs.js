const mongoose = require('mongoose');

// src/models/Logs.js (Used for both Consumption and Waste)
const logSchema = new mongoose.Schema({
    type: { type: String, enum: ['consumption', 'waste'], required: true },
    ingredient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient' },
    recipe_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', default: null },
    quantity: { type: Number, required: true },
    reason: { type: String }, // Specifically for waste
    created_at: { type: Date, default: Date.now }
  });
  module.exports = mongoose.model('Log', logSchema);