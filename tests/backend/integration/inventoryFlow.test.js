const request = require('supertest');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../setup/.env.test') });

const app = require('../../../../backend_mysql/src/app');
const { makeUser, makeIngredient, makeRecipe } = require('../../utils/testDataFactory');

/**
 * Integration: Login → Create Ingredient → Create Recipe → Prepare Dish → Check Stock Reduced
 */
describe('Integration: Inventory Flow', () => {
  let token;
  let ingredientId;
  let recipeId;
  let initialStock;

  const user = makeUser({ email: `integ_inv_${Date.now()}@test.com` });

  it('1. registers admin', async () => {
    const res = await request(app).post('/api/auth/signup').send(user);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    token = res.body.token;
  });

  it('2. creates an ingredient with stock', async () => {
    initialStock = 50;
    const res = await request(app)
      .post('/api/ingredients')
      .set('Authorization', `Bearer ${token}`)
      .send(makeIngredient({ currentStock: initialStock, minThreshold: 5 }));
    expect(res.status).toBe(201);
    ingredientId = res.body._id;
  });

  it('3. creates a recipe using that ingredient', async () => {
    const res = await request(app)
      .post('/api/recipe')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Dish',
        ingredientsMap: [{ ingredient_id: ingredientId, quantity_required: 2 }],
      });
    expect(res.status).toBe(201);
    recipeId = res.body._id;
  });

  it('4. prepares dish and deducts stock', async () => {
    const res = await request(app)
      .post('/api/consumption/prepare')
      .set('Authorization', `Bearer ${token}`)
      .send({
        recipe_id: recipeId,
        items: [{ ingredient_id: ingredientId, quantity_required: 2 }],
      });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Stock deducted successfully');
  });

  it('5. verifies stock was reduced', async () => {
    const res = await request(app)
      .get('/api/ingredients')
      .set('Authorization', `Bearer ${token}`);
    const ing = res.body.data.find(i => i._id === ingredientId);
    expect(ing).toBeDefined();
    expect(Number(ing.current_stock)).toBe(initialStock - 2);
  });

  it('6. consumption log appears in history', async () => {
    const res = await request(app)
      .get('/api/consumption?page=1&limit=10')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});
