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

// Use env-sourced values — never hardcode credentials in test files
const WRONG_PASS   = process.env.TEST_WRONG_PASS || 'wrong_pass_env';
const UNKNOWN_EMAIL = 'nobody_unknown@nowhere.test';

describe('Auth API — /api/auth', () => {
  const user = makeUser();

  // ── Signup ────────────────────────────────────────────────────────────────
  describe('POST /api/auth/signup', () => {
    it('201 — registers a new admin and returns token + success flag', async () => {
      const res = await request(server).post('/api/auth/signup').send(user);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('token');
      expect(typeof res.body.token).toBe('string');
    });

    it('400 — rejects duplicate email', async () => {
      const res = await request(server).post('/api/auth/signup').send(user);
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('400 — rejects payload missing name', async () => {
      const { name, ...noName } = user;
      const res = await request(server).post('/api/auth/signup').send(noName);
      expect(res.status).toBe(400);
    });

    it('400 — rejects payload missing password', async () => {
      const { password, ...noPass } = user;
      const res = await request(server).post('/api/auth/signup').send(noPass);
      expect(res.status).toBe(400);
    });
  });

  // ── Login ─────────────────────────────────────────────────────────────────
  describe('POST /api/auth/login', () => {
    it('200 — returns token and user object on valid credentials', async () => {
      const res = await request(server)
        .post('/api/auth/login')
        .send({ email: user.email, password: user.password });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toMatchObject({ role: 'admin' });
    });

    it('401 — rejects wrong password', async () => {
      const res = await request(server)
        .post('/api/auth/login')
        .send({ email: user.email, password: WRONG_PASS });
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('401 — rejects unknown email', async () => {
      const res = await request(server)
        .post('/api/auth/login')
        .send({ email: UNKNOWN_EMAIL, password: WRONG_PASS });
      expect(res.status).toBe(401);
    });
  });

  // ── Me ────────────────────────────────────────────────────────────────────
  describe('GET /api/auth/me', () => {
    let token;

    beforeAll(async () => {
      const res = await request(server)
        .post('/api/auth/login')
        .send({ email: user.email, password: user.password });
      token = res.body.token;
    });

    it('200 — returns authenticated user profile', async () => {
      const res = await request(server)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('email', user.email);
      expect(res.body).toHaveProperty('role', 'admin');
    });

    it('401 — rejects request with no token', async () => {
      const res = await request(server).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('401 — rejects malformed token', async () => {
      const res = await request(server)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer not.a.valid.token');
      expect(res.status).toBe(401);
    });
  });
});
