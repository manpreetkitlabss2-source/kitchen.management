const request = require('supertest');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../setup/.env.test') });

const app = require('../../../../backend_mysql/src/app');
const { makeUser } = require('../../utils/testDataFactory');

describe('Users API', () => {
  let adminToken;
  let createdUserId;

  beforeAll(async () => {
    const admin = makeUser({ email: `users_admin_${Date.now()}@test.com` });
    await request(app).post('/api/auth/signup').send(admin);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: admin.email, password: admin.password });
    adminToken = res.body.token;
  });

  describe('POST /api/users/create', () => {
    it('admin creates a manager', async () => {
      const newUser = makeUser({ email: `mgr_${Date.now()}@test.com` });
      const res = await request(app)
        .post('/api/users/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...newUser, role: 'manager' });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toHaveProperty('role', 'manager');
      createdUserId = res.body.user.id;
    });

    it('rejects missing role field', async () => {
      const res = await request(app)
        .post('/api/users/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(makeUser({ email: `norole_${Date.now()}@test.com` }));
      expect(res.status).toBe(400);
    });

    it('rejects invalid role assignment (admin role)', async () => {
      const res = await request(app)
        .post('/api/users/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...makeUser({ email: `badrole_${Date.now()}@test.com` }), role: 'admin' });
      expect(res.status).toBe(403);
    });

    it('returns 401 without token', async () => {
      const res = await request(app)
        .post('/api/users/create')
        .send({ ...makeUser(), role: 'chef' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/users', () => {
    it('returns list of sub-users', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('hard-deletes a sub-user', async () => {
      const res = await request(app)
        .delete(`/api/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 404 for already-deleted user', async () => {
      const res = await request(app)
        .delete(`/api/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });
});
