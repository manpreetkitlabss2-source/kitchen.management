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

describe('Ingredients API — /api/ingredients', () => {
  let token;
  let createdId;

  beforeAll(async () => {
    const user = makeUser();
    await request(server).post('/api/auth/signup').send(user);
    const res = await request(server)
      .post('/api/auth/login')
      .send({ email: user.email, password: user.password });
    token = res.body.token;
  });

  // ── Create ────────────────────────────────────────────────────────────────
  describe('POST /api/ingredients', () => {
    it('201 — creates ingredient and returns _id', async () => {
      const payload = makeIngredient();
      const res = await request(server)
        .post('/api/ingredients')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.name).toBe(payload.name);
      expect(res.body.unit).toBe(payload.unit.toLowerCase());
      createdId = res.body._id;
    });

    it('400 — rejects missing name', async () => {
      const { name, ...noName } = makeIngredient();
      const res = await request(server)
        .post('/api/ingredients')
        .set('Authorization', `Bearer ${token}`)
        .send(noName);
      expect(res.status).toBe(400);
    });

    it('400 — rejects missing unit', async () => {
      const { unit, ...noUnit } = makeIngredient();
      const res = await request(server)
        .post('/api/ingredients')
        .set('Authorization', `Bearer ${token}`)
        .send(noUnit);
      expect(res.status).toBe(400);
    });

    it('401 — rejects unauthenticated request', async () => {
      const res = await request(server)
        .post('/api/ingredients')
        .send(makeIngredient());
      expect(res.status).toBe(401);
    });
  });

  // ── Read ──────────────────────────────────────────────────────────────────
  describe('GET /api/ingredients', () => {
    it('200 — returns paginated list with data, total, page, limit', async () => {
      const res = await request(server)
        .get('/api/ingredients?page=1&limit=5')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('page', 1);
      expect(res.body).toHaveProperty('limit', 5);
    });

    it('401 — rejects unauthenticated request', async () => {
      const res = await request(server).get('/api/ingredients');
      expect(res.status).toBe(401);
    });
  });

  // ── Update ────────────────────────────────────────────────────────────────
  describe('PUT /api/ingredients', () => {
    it('200 — updates allowed ingredient fields', async () => {
      const res = await request(server)
        .put('/api/ingredients')
        .set('Authorization', `Bearer ${token}`)
        .send({ _id: createdId, name: 'Updated Ingredient', threshold_value: 5 });
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated Ingredient');
      expect(Number(res.body.threshold_value)).toBe(5);
    });

    it('500 — rejects direct stock updates', async () => {
      const res = await request(server)
        .put('/api/ingredients')
        .set('Authorization', `Bearer ${token}`)
        .send({ _id: createdId, current_stock: 10 });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('500 — rejects update without _id', async () => {
      const res = await request(server)
        .put('/api/ingredients')
        .set('Authorization', `Bearer ${token}`)
        .send({ threshold_value: 10 });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  // ── Delete ────────────────────────────────────────────────────────────────
  describe('DELETE /api/ingredients/:id', () => {
    it('200 — soft-deletes ingredient', async () => {
      const res = await request(server)
        .delete(`/api/ingredients/${createdId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('404 — returns 404 for already-deleted ingredient', async () => {
      const res = await request(server)
        .delete(`/api/ingredients/${createdId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });

    it('401 — rejects unauthenticated request', async () => {
      const res = await request(server).delete(`/api/ingredients/${createdId}`);
      expect(res.status).toBe(401);
    });
  });
});
