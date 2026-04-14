const request = require('supertest');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../setup/.env.test') });

const app = require('../../../../backend_mysql/src/app');
const { makeUser, makeIngredient, makeRecipe } = require('../../utils/testDataFactory');

describe('Orders API', () => {
  let token;
  let recipeId;

  beforeAll(async () => {
    const user = makeUser({ email: `order_test_${Date.now()}@test.com` });
    await request(app).post('/api/auth/signup').send(user);
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: user.password });
    token = loginRes.body.token;

    // Create ingredient with enough stock
    const ingRes = await request(app)
      .post('/api/ingredients')
      .set('Authorization', `Bearer ${token}`)
      .send(makeIngredient({ currentStock: 100, minThreshold: 5 }));
    const ingredientId = ingRes.body._id;

    // Create recipe using that ingredient
    const recipeRes = await request(app)
      .post('/api/recipe')
      .set('Authorization', `Bearer ${token}`)
      .send(makeRecipe([ingredientId], { ingredientsMap: [{ ingredient_id: ingredientId, quantity_required: 0.1 }] }));
    recipeId = recipeRes.body._id;
  });

  describe('POST /api/orders', () => {
    it('places an order and deducts stock', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ items: [{ recipe_id: recipeId, quantity: 1 }] });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('message', 'Order placed successfully');
      expect(res.body.result).toHaveProperty('id');
    });

    it('rejects empty items array', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ items: [] });
      expect(res.status).toBe(400);
    });

    it('rejects non-existent recipe', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ items: [{ recipe_id: 999999, quantity: 1 }] });
      expect(res.status).toBe(400);
    });

    it('returns 401 without token', async () => {
      const res = await request(app)
        .post('/api/orders')
        .send({ items: [{ recipe_id: recipeId, quantity: 1 }] });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/orders', () => {
    it('returns paginated order list', async () => {
      const res = await request(app)
        .get('/api/orders?page=1&limit=5')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body).toHaveProperty('total');
    });
  });
});
