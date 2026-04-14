const request = require('supertest');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../setup/.env.test') });

const app = require('../../../../backend_mysql/src/app');
const { makeUser, makeIngredient, makeBatch } = require('../../utils/testDataFactory');

/**
 * Integration: Create Ingredient → Add Batch → Verify Stock Recalculated → Delete Batch → Verify Stock Drops
 */
describe('Integration: Batch → Stock Recalculation', () => {
  let token;
  let ingredientId;
  let batchId;

  const user = makeUser({ email: `integ_batch_${Date.now()}@test.com` });

  beforeAll(async () => {
    await request(app).post('/api/auth/signup').send(user);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: user.password });
    token = res.body.token;
  });

  it('creates ingredient with zero stock', async () => {
    const res = await request(app)
      .post('/api/ingredients')
      .set('Authorization', `Bearer ${token}`)
      .send(makeIngredient({ currentStock: 0, minThreshold: 5 }));
    expect(res.status).toBe(201);
    ingredientId = Number(res.body._id);
  });

  it('adds a batch and stock is recalculated upward', async () => {
    const res = await request(app)
      .post('/api/batches')
      .set('Authorization', `Bearer ${token}`)
      .send(makeBatch(ingredientId, { quantity: 20 }));
    expect(res.status).toBe(201);
    batchId = res.body.data.id;

    const ingRes = await request(app)
      .get('/api/ingredients')
      .set('Authorization', `Bearer ${token}`);
    const ing = ingRes.body.data.find(i => Number(i._id) === ingredientId);
    expect(Number(ing.current_stock)).toBe(20);
  });

  it('deletes batch and stock drops to zero', async () => {
    await request(app)
      .delete(`/api/batches/${batchId}`)
      .set('Authorization', `Bearer ${token}`);

    const ingRes = await request(app)
      .get('/api/ingredients')
      .set('Authorization', `Bearer ${token}`);
    const ing = ingRes.body.data.find(i => Number(i._id) === ingredientId);
    expect(Number(ing.current_stock)).toBe(0);
  });
});
