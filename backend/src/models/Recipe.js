
// src/models/Recipe.js
const mongoose = require('mongoose');
const recipeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  ingredients: [{
    ingredient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient' },
    quantity_required: { type: Number, required: true }
  }]
});
module.exports = mongoose.model('Recipe', recipeSchema);
