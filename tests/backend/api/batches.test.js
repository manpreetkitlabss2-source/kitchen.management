const request = require('supertest');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../setup/.env.test') });

const app = require('../../../../backend_mysql/src/app');
const { makeUser, makeIngredient, makeBatch } = require('../../utils/testDataFactory');

describe('Batches API', () => {
  let token;
  let ingredientId;
  let batchId;

  beforeAll(async () => {
    const user = makeUser({ email: `batch_test_${Date.now()}@test.com` });
    await request(app).post('/api/auth/signup').send(user);
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: user.password });
    token = loginRes.body.token;

    const ingRes = await request(app)
      .post('/api/ingredients')
      .set('Authorization', `Bearer ${token}`)
      .send(makeIngredient({ currentStock: 0 }));
    ingredientId = Number(ingRes.body._id);
  });

  describe('POST /api/batches', () => {
    it('creates a batch for a valid ingredient', async () => {
      const payload = makeBatch(ingredientId);
      const res = await request(app)
        .post('/api/batches')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      batchId = res.body.data.id;
    });

    it('rejects missing expiry_date', async () => {
      const res = await request(app)
        .post('/api/batches')
        .set('Authorization', `Bearer ${token}`)
        .send({ ingredient_id: ingredientId, quantity: 5 });
      expect(res.status).toBe(400);
    });

    it('rejects past expiry_date', async () => {
      const res = await request(app)
        .post('/api/batches')
        .set('Authorization', `Bearer ${token}`)
        .send({ ingredient_id: ingredientId, quantity: 5, expiry_date: '2020-01-01' });
      expect(res.status).toBe(400);
    });

    it('rejects non-positive quantity', async () => {
      const future = new Date();
      future.setDate(future.getDate() + 10);
      const res = await request(app)
        .post('/api/batches')
        .set('Authorization', `Bearer ${token}`)
        .send({ ingredient_id: ingredientId, quantity: -1, expiry_date: future.toISOString().split('T')[0] });
      expect(res.status).toBe(400);
    });

    it('returns 401 without token', async () => {
      const res = await request(app).post('/api/batches').send(makeBatch(ingredientId));
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/batches', () => {
    it('returns paginated batch list', async () => {
      const res = await request(app)
        .get('/api/batches?page=1&limit=5')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('filters by status=active', async () => {
      const res = await request(app)
        .get('/api/batches?status=active')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/batches/expiring', () => {
    it('returns batches expiring within N days', async () => {
      const res = await request(app)
        .get('/api/batches/expiring?days=30')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/batches/:batch_id', () => {
    it('returns batch details', async () => {
      const res = await request(app)
        .get(`/api/batches/${batchId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('id', batchId);
    });

    it('returns 404 for non-existent batch', async () => {
      const res = await request(app)
        .get('/api/batches/999999')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/batches/:batch_id', () => {
    it('updates batch quantity', async () => {
      const future = new Date();
      future.setDate(future.getDate() + 20);
      const res = await request(app)
        .put(`/api/batches/${batchId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ quantity: 25, expiry_date: future.toISOString().split('T')[0] });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('rejects update with no fields', async () => {
      const res = await request(app)
        .put(`/api/batches/${batchId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({});
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/batches/:batch_id', () => {
    it('deletes a batch', async () => {
      const res = await request(app)
        .delete(`/api/batches/${batchId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 404 for already-deleted batch', async () => {
      const res = await request(app)
        .delete(`/api/batches/${batchId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });
});
