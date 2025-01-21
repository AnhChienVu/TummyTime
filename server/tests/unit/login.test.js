const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const loginRoute = require('../../src/routes/api/login');
const pool = require('../../database/db');
const {
  createSuccessResponse,
  createErrorResponse,
} = require('../../src/utils/response');
const bcrypt = require('bcryptjs');

jest.mock('../../database/db');
jest.mock('../../src/utils/response');

const app = express();
app.use(bodyParser.json());
app.post('/login', loginRoute);

describe('POST /login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return 401 if user does not exist', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [],
    });

    const res = await request(app).post('/login').send({
      email: 'john.doe@example.com',
      password: 'Password1@',
    });

    expect(res.status).toBe(401);
    expect(createErrorResponse).toHaveBeenCalledWith(401, "User doesn't exist");
  });

  test('should return 401 if password is incorrect', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ email: 'john.doe@example.com', password: 'hashedPassword' }],
    });

    jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(false);

    const res = await request(app).post('/login').send({
      email: 'john.doe@example.com',
      password: 'wrongPassword',
    });

    expect(res.status).toBe(401);
    expect(createErrorResponse).toHaveBeenCalledWith(
      401,
      'Invalid credentials'
    );
  });

  test('should return 200 and login successfully', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ email: 'john.doe@example.com', password: 'hashedPassword' }],
    });

    jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true);

    const res = await request(app)
      .post('/login')
      .send({ email: 'john.doe@example.com', password: 'Password1@' });

    expect(res.status).toBe(200);
    expect(createSuccessResponse).toHaveBeenCalledWith({
      success: true,
      message: 'Login successfully',
      token: expect.any(String),
    });
  });

  test('should return 500 if there is a server error', async () => {
    pool.query.mockRejectedValueOnce(new Error('Server error'));
    const res = await request(app).post('/login').send({
      email: 'john.doe@example.com',
      password: 'Password1@',
    });

    expect(res.status).toBe(500);
    expect(createErrorResponse).toHaveBeenCalledWith(
      500,
      'Internal server error'
    );
  });
});
