const request = require('supertest');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../setup/.env.test') });

const app = require('../../../../backend_mysql/src/app');
const { makeUser, makeIngredient } = require('../../utils/testDataFactory');

describe('Ingredients API', () => {
  let token;
  let createdId;

  beforeAll(async () => {
    const user = makeUser({ email: `ing_test_${Date.now()}@test.com` });
    await request(app).post('/api/auth/signup').send(user);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: user.password });
    token = res.body.token;
  });

  describe('POST /api/ingredients', () => {
    it('creates a new ingredient', async () => {
      const payload = makeIngredient();
      const res = await request(app)
        .post('/api/ingredients')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.name).toBe(payload.name);
      createdId = res.body._id;
    });

    it('rejects missing name', async () => {
      const res = await request(app)
        .post('/api/ingredients')
        .set('Authorization', `Bearer ${token}`)
        .send({ unit: 'kg', currentStock: 10 });
      expect(res.status).toBe(400);
    });

    it('returns 401 without token', async () => {
      const res = await request(app).post('/api/ingredients').send(makeIngredient());
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/ingredients', () => {
    it('returns paginated ingredient list', async () => {
      const res = await request(app)
        .get('/api/ingredients?page=1&limit=5')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body).toHaveProperty('total');
    });

    it('returns 401 without token', async () => {
      const res = await request(app).get('/api/ingredients');
      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/ingredients', () => {
    it('updates an existing ingredient', async () => {
      const res = await request(app)
        .put('/api/ingredients')
        .set('Authorization', `Bearer ${token}`)
        .send({ _id: createdId, current_stock: 99, threshold_value: 5 });
      expect(res.status).toBe(200);
      expect(Number(res.body.current_stock)).toBe(99);
    });

    it('rejects update without _id', async () => {
      const res = await request(app)
        .put('/api/ingredients')
        .set('Authorization', `Bearer ${token}`)
        .send({ current_stock: 10 });
      expect(res.status).toBe(500);
    });
  });

  describe('DELETE /api/ingredients/:id', () => {
    it('soft-deletes an ingredient', async () => {
      const res = await request(app)
        .delete(`/api/ingredients/${createdId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 404 for already-deleted ingredient', async () => {
      const res = await request(app)
        .delete(`/api/ingredients/${createdId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });
});
