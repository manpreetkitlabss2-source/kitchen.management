const makeOrderPayload = (recipeIds = []) => ({
  items: recipeIds.map(recipe_id => ({
    recipe_id,
    quantity: 1,
  })),
});

const makeConsumptionPayload = (ingredientIds = []) => ({
  recipe_id: null,
  items: ingredientIds.map(id => ({
    ingredient_id: id,
    quantity_required: 0.1,
  })),
});

module.exports = { makeOrderPayload, makeConsumptionPayload };
