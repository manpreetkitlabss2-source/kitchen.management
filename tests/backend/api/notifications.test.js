const request = require('supertest');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../setup/.env.test') });

const app = require('../../../../backend_mysql/src/app');
const { makeUser, makeIngredient } = require('../../utils/testDataFactory');

describe('Notifications API', () => {
  let token;

  beforeAll(async () => {
    const user = makeUser({ email: `notif_test_${Date.now()}@test.com` });
    await request(app).post('/api/auth/signup').send(user);
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: user.password });
    token = loginRes.body.token;

    // Seed a low-stock ingredient to trigger notifications
    await request(app)
      .post('/api/ingredients')
      .set('Authorization', `Bearer ${token}`)
      .send(makeIngredient({ currentStock: 1, minThreshold: 10 }));
  });

  describe('POST /api/notifications/scan', () => {
    it('scans stock and generates notifications', async () => {
      const res = await request(app)
        .post('/api/notifications/scan')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 401 without token', async () => {
      const res = await request(app).post('/api/notifications/scan');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/notifications', () => {
    it('returns paginated notifications', async () => {
      const res = await request(app)
        .get('/api/notifications?page=1&limit=10')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/notifications/unread-count', () => {
    it('returns unread count', async () => {
      const res = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('count');
      expect(typeof res.body.count).toBe('number');
    });
  });

  describe('PATCH /api/notifications/read-all', () => {
    it('marks all notifications as read', async () => {
      const res = await request(app)
        .patch('/api/notifications/read-all')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('PATCH /api/notifications/:id/read', () => {
    it('returns 404 for non-existent notification', async () => {
      const res = await request(app)
        .patch('/api/notifications/999999/read')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });
});
