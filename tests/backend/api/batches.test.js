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

const futureDate = (daysAhead = 30) => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
};

describe('Batches API — /api/batches', () => {
  let token;
  let ingredientId;
  let batchId;

  beforeAll(async () => {
    const user = makeUser();
    await request(server).post('/api/auth/signup').send(user);
    const loginRes = await request(server)
      .post('/api/auth/login')
      .send({ email: user.email, password: user.password });
    token = loginRes.body.token;

    const ingRes = await request(server)
      .post('/api/ingredients')
      .set('Authorization', `Bearer ${token}`)
      .send(makeIngredient({ currentStock: 0 }));
    ingredientId = Number(ingRes.body._id);
  });

  // ── Create ────────────────────────────────────────────────────────────────
  describe('POST /api/batches', () => {
    it('201 — creates batch and returns full batch object', async () => {
      const res = await request(server)
        .post('/api/batches')
        .set('Authorization', `Bearer ${token}`)
        .send(makeBatch(ingredientId));
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('ingredient_id', ingredientId);
      batchId = res.body.data.id;
    });

    it('400 — rejects missing expiry_date', async () => {
      const res = await request(server)
        .post('/api/batches')
        .set('Authorization', `Bearer ${token}`)
        .send({ ingredient_id: ingredientId, quantity: 5 });
      expect(res.status).toBe(400);
    });

    it('400 — rejects past expiry_date', async () => {
      const res = await request(server)
        .post('/api/batches')
        .set('Authorization', `Bearer ${token}`)
        .send({ ingredient_id: ingredientId, quantity: 5, expiry_date: '2020-01-01' });
      expect(res.status).toBe(400);
    });

    it('400 — rejects zero quantity', async () => {
      const res = await request(server)
        .post('/api/batches')
        .set('Authorization', `Bearer ${token}`)
        .send({ ingredient_id: ingredientId, quantity: 0, expiry_date: futureDate() });
      expect(res.status).toBe(400);
    });

    it('400 — rejects negative quantity', async () => {
      const res = await request(server)
        .post('/api/batches')
        .set('Authorization', `Bearer ${token}`)
        .send({ ingredient_id: ingredientId, quantity: -5, expiry_date: futureDate() });
      expect(res.status).toBe(400);
    });

    it('404 — rejects non-existent ingredient', async () => {
      const res = await request(server)
        .post('/api/batches')
        .set('Authorization', `Bearer ${token}`)
        .send({ ingredient_id: 999999, quantity: 5, expiry_date: futureDate() });
      expect(res.status).toBe(404);
    });

    it('401 — rejects unauthenticated request', async () => {
      const res = await request(server)
        .post('/api/batches')
        .send(makeBatch(ingredientId));
      expect(res.status).toBe(401);
    });
  });

  // ── List ──────────────────────────────────────────────────────────────────
  describe('GET /api/batches', () => {
    it('200 — returns paginated list', async () => {
      const res = await request(server)
        .get('/api/batches?page=1&limit=5')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body).toHaveProperty('total');
    });

    it('200 — filters by status=active', async () => {
      const res = await request(server)
        .get('/api/batches?status=active')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      res.body.data.forEach(b => expect(b.status).toBe('active'));
    });
  });

  // ── Expiring ──────────────────────────────────────────────────────────────
  describe('GET /api/batches/expiring', () => {
    it('200 — returns batches expiring within given days', async () => {
      const res = await request(server)
        .get('/api/batches/expiring?days=60')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('400 — rejects negative days param', async () => {
      const res = await request(server)
        .get('/api/batches/expiring?days=-1')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
    });
  });

  // ── Detail ────────────────────────────────────────────────────────────────
  describe('GET /api/batches/:batch_id', () => {
    it('200 — returns batch detail', async () => {
      const res = await request(server)
        .get(`/api/batches/${batchId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('id', batchId);
      expect(res.body.data).toHaveProperty('status');
    });

    it('404 — returns 404 for non-existent batch', async () => {
      const res = await request(server)
        .get('/api/batches/999999')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });

  // ── Update ────────────────────────────────────────────────────────────────
  describe('PUT /api/batches/:batch_id', () => {
    it('200 — updates quantity and expiry_date', async () => {
      const res = await request(server)
        .put(`/api/batches/${batchId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ quantity: 25, expiry_date: futureDate(45) });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.quantity).toBe(25);
    });

    it('400 — rejects empty body', async () => {
      const res = await request(server)
        .put(`/api/batches/${batchId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({});
      expect(res.status).toBe(400);
    });

    it('404 — returns 404 for non-existent batch', async () => {
      const res = await request(server)
        .put('/api/batches/999999')
        .set('Authorization', `Bearer ${token}`)
        .send({ quantity: 10 });
      expect(res.status).toBe(404);
    });
  });

  // ── Delete ────────────────────────────────────────────────────────────────
  describe('DELETE /api/batches/:batch_id', () => {
    it('200 — deletes batch', async () => {
      const res = await request(server)
        .delete(`/api/batches/${batchId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('404 — returns 404 for already-deleted batch', async () => {
      const res = await request(server)
        .delete(`/api/batches/${batchId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });
});
