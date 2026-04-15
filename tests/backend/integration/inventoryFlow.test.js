const http    = require('http');
const request = require('supertest');
const app     = require('@backend/app');
const { makeUser, makeIngredient } = require('../../utils/testDataFactory');

const server = http.createServer(app);
beforeAll(() => new Promise((resolve) =>
  server.listen(0, () => { server.unref(); resolve(); })
));
afterAll(() => new Promise((resolve) =>
  server.closeAllConnections
    ? (server.closeAllConnections(), server.close(resolve))
    : server.close(resolve)
));

/**
 * End-to-end flow:
 * Signup → Login → Create Ingredient → Create Recipe →
 * Prepare Dish → Verify Stock Deducted → Verify Consumption Log →
 * Log Waste → Verify Stock Deducted Again
 */
describe('Integration — Full Inventory Flow', () => {
  let token;
  let ingredientId;
  let recipeId;
  const INITIAL_STOCK = 50;
  const CONSUME_QTY   = 2;
  const WASTE_QTY     = 1;

  const user = makeUser();

  beforeAll(async () => {
    const signupRes = await request(server).post('/api/auth/signup').send(user);
    expect(signupRes.status).toBe(201);
    token = signupRes.body.token;
  });

  it('creates ingredient with known stock', async () => {
    const res = await request(server)
      .post('/api/ingredients')
      .set('Authorization', `Bearer ${token}`)
      .send(makeIngredient({ minThreshold: 5 }));
    expect(res.status).toBe(201);
    ingredientId = res.body._id;

    // Add batch to set initial stock
    const batchRes = await request(server)
      .post('/api/batches')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ingredient_id: ingredientId,
        quantity: INITIAL_STOCK,
        expiry_date: '2026-12-31'
      });
    expect(batchRes.status).toBe(201);
  });

  it('creates recipe mapping that ingredient', async () => {
    const res = await request(server)
      .post('/api/recipe')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name          : 'Integration Test Dish',
        ingredientsMap: [{ ingredient_id: ingredientId, quantity_required: CONSUME_QTY }],
      });
    expect(res.status).toBe(201);
    recipeId = res.body._id;
  });

  it('prepares dish — deducts stock', async () => {
    const res = await request(server)
      .post('/api/consumption/prepare')
      .set('Authorization', `Bearer ${token}`)
      .send({
        recipe_id: recipeId,
        items    : [{ ingredient_id: ingredientId, quantity_required: CONSUME_QTY }],
      });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Stock deducted successfully');
  });

  it('stock is reduced by consumed quantity', async () => {
    const res = await request(server)
      .get('/api/ingredients')
      .set('Authorization', `Bearer ${token}`);
    const ing = res.body.data.find(i => i._id === ingredientId);
    expect(ing).toBeDefined();
    expect(Number(ing.current_stock)).toBe(INITIAL_STOCK - CONSUME_QTY);
  });

  it('consumption log contains the new entry', async () => {
    const res = await request(server)
      .get('/api/consumption?page=1&limit=10')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    const entry = res.body.data.find(
      l => l.ingredient_id._id === ingredientId || l.ingredient_id === ingredientId
    );
    expect(entry).toBeDefined();
  });

  it('logs waste — deducts stock further', async () => {
    const res = await request(server)
      .post('/api/waste')
      .set('Authorization', `Bearer ${token}`)
      .send({ ingredientId, quantity: WASTE_QTY, reason: 'Spoiled' });
    expect(res.status).toBe(200);
  });

  it('stock is reduced by waste quantity', async () => {
    const res = await request(server)
      .get('/api/ingredients')
      .set('Authorization', `Bearer ${token}`);
    const ing = res.body.data.find(i => i._id === ingredientId);
    expect(Number(ing.current_stock)).toBe(INITIAL_STOCK - CONSUME_QTY - WASTE_QTY);
  });

  it('dashboard reflects updated counts', async () => {
    const res = await request(server)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.summary).toHaveProperty('totalIngredients');
    expect(res.body.summary.totalConsumption).toBeGreaterThan(0);
  });
});
