/**
 * Build an order payload from recipe IDs.
 * @param {string[]} recipeIds
 * @param {number}   quantity  per item
 */
const makeOrderPayload = (recipeIds = [], quantity = 1) => ({
  items: recipeIds.map(recipe_id => ({ recipe_id, quantity })),
});

/**
 * Build a manual consumption payload from ingredient IDs.
 * @param {string[]} ingredientIds
 * @param {number}   quantityRequired  per item
 */
const makeConsumptionPayload = (ingredientIds = [], quantityRequired = 0.1) => ({
  recipe_id: null,
  items: ingredientIds.map(ingredient_id => ({
    ingredient_id,
    quantity_required: quantityRequired,
  })),
});

module.exports = { makeOrderPayload, makeConsumptionPayload };
