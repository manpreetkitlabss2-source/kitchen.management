const { faker } = require('@faker-js/faker');

// Read test password from env — never hardcode credentials
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'Test@1234_env_default';

/**
 * Generates a valid admin signup payload.
 * @param {object} overrides
 */
const makeUser = (overrides = {}) => ({
  name          : faker.person.fullName(),
  restaurantName: faker.company.name(),
  email         : `test_${Date.now()}_${faker.string.alphanumeric(6)}@kitchenpro.test`,
  password      : TEST_PASSWORD,
  ...overrides,
});

/**
 * Generates a valid ingredient payload.
 * @param {object} overrides
 */
const makeIngredient = (overrides = {}) => ({
  name        : faker.commerce.productName(),
  unit        : faker.helpers.arrayElement(['kg', 'liters', 'pieces', 'grams', 'ml']),
  minThreshold: faker.number.float({ min: 1,  max: 9,   fractionDigits: 1 }),
  ...overrides,
});

/**
 * Generates a valid recipe payload.
 * @param {string[]} ingredientIds  Array of ingredient _id strings
 * @param {object}   overrides
 */
const makeRecipe = (ingredientIds = [], overrides = {}) => ({
  name          : faker.commerce.product(),
  ingredientsMap: ingredientIds.map(id => ({
    ingredient_id    : id,
    quantity_required: faker.number.float({ min: 0.1, max: 2, fractionDigits: 1 }),
  })),
  ...overrides,
});

/**
 * Generates a valid batch payload with a future expiry date.
 * @param {number|string} ingredientId
 * @param {object}        overrides
 */
const makeBatch = (ingredientId, overrides = {}) => {
  const future = new Date();
  future.setDate(future.getDate() + faker.number.int({ min: 5, max: 60 }));
  return {
    ingredient_id: ingredientId,
    quantity     : faker.number.float({ min: 5, max: 50, fractionDigits: 1 }),
    expiry_date  : future.toISOString().split('T')[0],
    ...overrides,
  };
};

/**
 * Generates a valid waste log payload.
 * @param {number|string} ingredientId
 * @param {object}        overrides
 */
const makeWasteLog = (ingredientId, overrides = {}) => ({
  ingredientId,
  quantity: faker.number.float({ min: 0.1, max: 2, fractionDigits: 1 }),
  reason  : faker.helpers.arrayElement(['Expired', 'Spoiled', 'Overcooked', 'Damaged', 'Other']),
  ...overrides,
});

/**
 * Generates an order payload from an array of recipe IDs.
 * @param {string[]} recipeIds
 */
const makeOrder = (recipeIds = []) => ({
  items: recipeIds.map(recipe_id => ({ recipe_id, quantity: 1 })),
});

module.exports = { makeUser, makeIngredient, makeRecipe, makeBatch, makeWasteLog, makeOrder };
