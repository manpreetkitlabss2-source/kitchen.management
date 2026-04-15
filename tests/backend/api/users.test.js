const http    = require('http');
const request = require('supertest');
const app     = require('@backend/app');
const { makeUser } = require('../../utils/testDataFactory');

const server = http.createServer(app);
beforeAll(() => new Promise((resolve) =>
  server.listen(0, () => { server.unref(); resolve(); })
));
afterAll(() => new Promise((resolve) =>
  server.closeAllConnections
    ? (server.closeAllConnections(), server.close(resolve))
    : server.close(resolve)
));

describe('Users API — /api/users', () => {
  let adminToken;
  let createdUserId;

  beforeAll(async () => {
    const admin = makeUser();
    await request(server).post('/api/auth/signup').send(admin);
    const res = await request(server)
      .post('/api/auth/login')
      .send({ email: admin.email, password: admin.password });
    adminToken = res.body.token;
  });

  // ── Create sub-user ───────────────────────────────────────────────────────
  describe('POST /api/users/create', () => {
    it('201 — admin creates a manager', async () => {
      const res = await request(server)
        .post('/api/users/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...makeUser(), role: 'manager' });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toHaveProperty('role', 'manager');
      createdUserId = res.body.user.id;
    });

    it('201 — admin creates a chef', async () => {
      const res = await request(server)
        .post('/api/users/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...makeUser(), role: 'chef' });
      expect(res.status).toBe(201);
      expect(res.body.user).toHaveProperty('role', 'chef');
    });

    it('201 — admin creates an inventory_staff', async () => {
      const res = await request(server)
        .post('/api/users/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...makeUser(), role: 'inventory_staff' });
      expect(res.status).toBe(201);
      expect(res.body.user).toHaveProperty('role', 'inventory_staff');
    });

    it('400 — rejects missing role field', async () => {
      const res = await request(server)
        .post('/api/users/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(makeUser());
      expect(res.status).toBe(400);
    });

    it('403 — rejects assigning admin role', async () => {
      const res = await request(server)
        .post('/api/users/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...makeUser(), role: 'admin' });
      expect(res.status).toBe(403);
    });

    it('401 — rejects unauthenticated request', async () => {
      const res = await request(server)
        .post('/api/users/create')
        .send({ ...makeUser(), role: 'chef' });
      expect(res.status).toBe(401);
    });
  });

  // ── List users ────────────────────────────────────────────────────────────
  describe('GET /api/users', () => {
    it('200 — returns list of sub-users', async () => {
      const res = await request(server)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('401 — rejects unauthenticated request', async () => {
      const res = await request(server).get('/api/users');
      expect(res.status).toBe(401);
    });
  });

  // ── Hard delete sub-user ──────────────────────────────────────────────────
  describe('DELETE /api/users/:id', () => {
    it('200 — hard-deletes a sub-user', async () => {
      const res = await request(server)
        .delete(`/api/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('404 — returns 404 for already-deleted user', async () => {
      const res = await request(server)
        .delete(`/api/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });

    it('401 — rejects unauthenticated request', async () => {
      const res = await request(server).delete(`/api/users/${createdUserId}`);
      expect(res.status).toBe(401);
    });
  });
});
