// tests/unit/app.test.js

const request = require('supertest');

const app = require('../../src/app');

describe('/ app exception check', () => {
  test('should return HTTP 404 response', async () => {
    const res = await request(app).get('/notfoundcheck_404');
    expect(res.statusCode).toBe(404);
  });
});
