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

describe('Orders API — /api/orders', () => {
  let token;
  let recipeId;

  beforeAll(async () => {
    const user = makeUser();
    await request(server).post('/api/auth/signup').send(user);
    const loginRes = await request(server)
      .post('/api/auth/login')
      .send({ email: user.email, password: user.password });
    token = loginRes.body.token;

    // Seed ingredient with ample stock
    const ingRes = await request(server)
      .post('/api/ingredients')
      .set('Authorization', `Bearer ${token}`)
      .send(makeIngredient({ minThreshold: 5 }));
    const ingredientId = ingRes.body._id;

    await request(server)
      .post('/api/batches')
      .set('Authorization', `Bearer ${token}`)
      .send(makeBatch(ingredientId, { quantity: 500 }));

    // Seed recipe using that ingredient
    const recipeRes = await request(server)
      .post('/api/recipe')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name          : 'Test Order Dish',
        ingredientsMap: [{ ingredient_id: ingredientId, quantity_required: 0.1 }],
      });
    recipeId = recipeRes.body._id;
  });

  // ── Place order ───────────────────────────────────────────────────────────
  describe('POST /api/orders', () => {
    it('201 — places order and returns id + status', async () => {
      const res = await request(server)
        .post('/api/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ items: [{ recipe_id: recipeId, quantity: 1 }] });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('message', 'Order placed successfully');
      expect(res.body.result).toHaveProperty('id');
      expect(res.body.result).toHaveProperty('status', 'completed');
    });

    it('400 — rejects empty items array', async () => {
      const res = await request(server)
        .post('/api/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ items: [] });
      expect(res.status).toBe(400);
    });

    it('400 — rejects missing items field', async () => {
      const res = await request(server)
        .post('/api/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({});
      expect(res.status).toBe(400);
    });

    it('400 — rejects non-existent recipe_id', async () => {
      const res = await request(server)
        .post('/api/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ items: [{ recipe_id: 999999, quantity: 1 }] });
      expect(res.status).toBe(400);
    });

    it('401 — rejects unauthenticated request', async () => {
      const res = await request(server)
        .post('/api/orders')
        .send({ items: [{ recipe_id: recipeId, quantity: 1 }] });
      expect(res.status).toBe(401);
    });
  });

  // ── List orders ───────────────────────────────────────────────────────────
  describe('GET /api/orders', () => {
    it('200 — returns paginated order list', async () => {
      const res = await request(server)
        .get('/api/orders?page=1&limit=5')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body).toHaveProperty('total');
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('401 — rejects unauthenticated request', async () => {
      const res = await request(server).get('/api/orders');
      expect(res.status).toBe(401);
    });
  });
});
