const http    = require('http');
const request = require('supertest');
const app     = require('@backend/app');
const { makeUser, makeIngredient, makeBatch } = require('../../utils/testDataFactory');

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
 * Create Ingredient (stock=0) → Add Batch → Verify Stock Recalculated Up →
 * Add Second Batch → Verify Stock Accumulates →
 * Delete First Batch → Verify Stock Drops → Delete Second Batch → Stock = 0
 */
describe('Integration — Batch → Stock Recalculation', () => {
  let token;
  let ingredientId;
  let batchId1;
  let batchId2;

  const user = makeUser();

  beforeAll(async () => {
    await request(server).post('/api/auth/signup').send(user);
    const res = await request(server)
      .post('/api/auth/login')
      .send({ email: user.email, password: user.password });
    token = res.body.token;
  });

  const getStock = async () => {
    const res = await request(server)
      .get('/api/ingredients')
      .set('Authorization', `Bearer ${token}`);
    const ing = res.body.data.find(i => Number(i._id) === ingredientId);
    return Number(ing?.current_stock ?? -1);
  };

  it('creates ingredient with zero stock', async () => {
    const res = await request(server)
      .post('/api/ingredients')
      .set('Authorization', `Bearer ${token}`)
      .send(makeIngredient({ minThreshold: 5 }));
    expect(res.status).toBe(201);
    ingredientId = Number(res.body._id);
    expect(await getStock()).toBe(0);
  });

  it('adds first batch (qty=20) — stock becomes 20', async () => {
    const res = await request(server)
      .post('/api/batches')
      .set('Authorization', `Bearer ${token}`)
      .send(makeBatch(ingredientId, { quantity: 20 }));
    expect(res.status).toBe(201);
    batchId1 = res.body.data.id;
    expect(await getStock()).toBe(20);
  });

  it('adds second batch (qty=15) — stock becomes 35', async () => {
    const res = await request(server)
      .post('/api/batches')
      .set('Authorization', `Bearer ${token}`)
      .send(makeBatch(ingredientId, { quantity: 15 }));
    expect(res.status).toBe(201);
    batchId2 = res.body.data.id;
    expect(await getStock()).toBe(35);
  });

  it('deletes first batch — stock drops to 15', async () => {
    await request(server)
      .delete(`/api/batches/${batchId1}`)
      .set('Authorization', `Bearer ${token}`);
    expect(await getStock()).toBe(15);
  });

  it('deletes second batch — stock returns to 0', async () => {
    await request(server)
      .delete(`/api/batches/${batchId2}`)
      .set('Authorization', `Bearer ${token}`);
    expect(await getStock()).toBe(0);
  });

  it('batches by ingredient returns empty list after deletion', async () => {
    const res = await request(server)
      .get(`/api/batches/ingredient/${ingredientId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });
});
