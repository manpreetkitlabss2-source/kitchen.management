const request = require('supertest');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../setup/.env.test') });

const app = require('../../../../backend_mysql/src/app');
const { makeUser } = require('../../utils/testDataFactory');

describe('Auth API', () => {
  const user = makeUser({ email: `auth_test_${Date.now()}@test.com` });

  describe('POST /api/auth/signup', () => {
    it('registers a new admin and returns a token', async () => {
      const res = await request(app).post('/api/auth/signup').send(user);
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.success).toBe(true);
    });

    it('rejects duplicate email', async () => {
      const res = await request(app).post('/api/auth/signup').send(user);
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('rejects missing fields', async () => {
      const res = await request(app).post('/api/auth/signup').send({ email: 'x@x.com' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('logs in with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: user.email, password: user.password });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.success).toBe(true);
      expect(res.body.user).toHaveProperty('role', 'admin');
    });

    it('rejects wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: user.email, password: 'wrongpassword' });
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('rejects unknown email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@nowhere.com', password: 'pass' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    let token;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: user.email, password: user.password });
      token = res.body.token;
    });

    it('returns current user profile', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('email', user.email);
    });

    it('returns 401 without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });
});
