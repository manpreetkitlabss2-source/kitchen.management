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

describe('Notifications API — /api/notifications', () => {
  let token;

  beforeAll(async () => {
    const user = makeUser();
    await request(server).post('/api/auth/signup').send(user);
    const loginRes = await request(server)
      .post('/api/auth/login')
      .send({ email: user.email, password: user.password });
    token = loginRes.body.token;

    // Seed a low-stock ingredient so scan generates a notification
    await request(server)
      .post('/api/ingredients')
      .set('Authorization', `Bearer ${token}`)
      .send(makeIngredient({ currentStock: 1, minThreshold: 50 }));

    // Run scan so notifications exist for subsequent tests
    await request(server)
      .post('/api/notifications/scan')
      .set('Authorization', `Bearer ${token}`);
  });

  // ── Scan ──────────────────────────────────────────────────────────────────
  describe('POST /api/notifications/scan', () => {
    it('200 — scan returns success', async () => {
      const res = await request(server)
        .post('/api/notifications/scan')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('401 — rejects unauthenticated request', async () => {
      const res = await request(server).post('/api/notifications/scan');
      expect(res.status).toBe(401);
    });
  });

  // ── List ──────────────────────────────────────────────────────────────────
  describe('GET /api/notifications', () => {
    it('200 — returns paginated notifications', async () => {
      const res = await request(server)
        .get('/api/notifications?page=1&limit=10')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body).toHaveProperty('total');
    });

    it('200 — each notification has required fields', async () => {
      const res = await request(server)
        .get('/api/notifications?page=1&limit=10')
        .set('Authorization', `Bearer ${token}`);
      res.body.data.forEach(n => {
        expect(n).toHaveProperty('_id');
        expect(n).toHaveProperty('type');
        expect(n).toHaveProperty('message');
        expect(n).toHaveProperty('is_read');
      });
    });
  });

  // ── Unread count ──────────────────────────────────────────────────────────
  describe('GET /api/notifications/unread-count', () => {
    it('200 — returns numeric count', async () => {
      const res = await request(server)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(typeof res.body.count).toBe('number');
      expect(res.body.count).toBeGreaterThanOrEqual(0);
    });
  });

  // ── Mark single as read ───────────────────────────────────────────────────
  describe('PATCH /api/notifications/:id/read', () => {
    it('404 — returns 404 for non-existent notification', async () => {
      const res = await request(server)
        .patch('/api/notifications/999999/read')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });

    it('200 — marks a real notification as read', async () => {
      const listRes = await request(server)
        .get('/api/notifications?page=1&limit=1')
        .set('Authorization', `Bearer ${token}`);
      const notif = listRes.body.data[0];
      if (!notif) return; // skip if no notifications exist

      const res = await request(server)
        .patch(`/api/notifications/${notif._id}/read`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.is_read).toBe(true);
    });
  });

  // ── Mark all as read ──────────────────────────────────────────────────────
  describe('PATCH /api/notifications/read-all', () => {
    it('200 — marks all as read and unread count becomes 0', async () => {
      const res = await request(server)
        .patch('/api/notifications/read-all')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const countRes = await request(server)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${token}`);
      expect(countRes.body.count).toBe(0);
    });
  });
});
