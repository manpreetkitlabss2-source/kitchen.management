const { faker } = require('@faker-js/faker');

const makeUser = (overrides = {}) => ({
  name: faker.person.fullName(),
  restaurantName: faker.company.name(),
  email: faker.internet.email().toLowerCase(),
  password: 'Test@1234',
  ...overrides,
});

const makeIngredient = (overrides = {}) => ({
  name: faker.food.ingredient(),
  unit: faker.helpers.arrayElement(['kg', 'liters', 'pieces', 'grams', 'ml']),
  currentStock: faker.number.float({ min: 5, max: 100, fractionDigits: 1 }),
  minThreshold: faker.number.float({ min: 1, max: 10, fractionDigits: 1 }),
  ...overrides,
});

const makeRecipe = (ingredientIds = [], overrides = {}) => ({
  name: faker.food.dish(),
  ingredientsMap: ingredientIds.map(id => ({
    ingredient_id: id,
    quantity_required: faker.number.float({ min: 0.1, max: 2, fractionDigits: 1 }),
  })),
  ...overrides,
});

const makeBatch = (ingredientId, overrides = {}) => {
  const future = new Date();
  future.setDate(future.getDate() + faker.number.int({ min: 5, max: 60 }));
  return {
    ingredient_id: ingredientId,
    quantity: faker.number.float({ min: 1, max: 50, fractionDigits: 1 }),
    expiry_date: future.toISOString().split('T')[0],
    ...overrides,
  };
};

const makeWasteLog = (ingredientId, overrides = {}) => ({
  ingredientId,
  quantity: faker.number.float({ min: 0.1, max: 2, fractionDigits: 1 }),
  reason: faker.helpers.arrayElement(['Expired', 'Spoiled', 'Overcooked', 'Damaged', 'Other']),
  ...overrides,
});

module.exports = { makeUser, makeIngredient, makeRecipe, makeBatch, makeWasteLog };
