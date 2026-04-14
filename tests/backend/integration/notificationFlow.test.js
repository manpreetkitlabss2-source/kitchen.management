const request = require('supertest');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../setup/.env.test') });

const app = require('../../../../backend_mysql/src/app');
const { makeUser, makeIngredient } = require('../../utils/testDataFactory');

/**
 * Integration: Create low-stock ingredient → Scan → Notification created → Mark read → Count drops
 */
describe('Integration: Notification Scan Flow', () => {
  let token;

  const user = makeUser({ email: `integ_notif_${Date.now()}@test.com` });

  beforeAll(async () => {
    await request(app).post('/api/auth/signup').send(user);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: user.password });
    token = res.body.token;

    // Seed a low-stock ingredient
    await request(app)
      .post('/api/ingredients')
      .set('Authorization', `Bearer ${token}`)
      .send(makeIngredient({ currentStock: 1, minThreshold: 20 }));
  });

  it('scan generates at least one notification', async () => {
    const scanRes = await request(app)
      .post('/api/notifications/scan')
      .set('Authorization', `Bearer ${token}`);
    expect(scanRes.status).toBe(200);

    const listRes = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${token}`);
    expect(listRes.body.data.length).toBeGreaterThan(0);
  });

  it('unread count is positive after scan', async () => {
    const res = await request(app)
      .get('/api/notifications/unread-count')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.count).toBeGreaterThan(0);
  });

  it('mark-all-read sets unread count to zero', async () => {
    await request(app)
      .patch('/api/notifications/read-all')
      .set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .get('/api/notifications/unread-count')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.count).toBe(0);
  });
});
