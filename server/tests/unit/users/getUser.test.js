// tests/unit/users/getUsers.test.js
// Tests the GET /v1/users/:id route

const request = require('supertest');
const express = require('express');
const passport = require('passport');
const pool = require('../../../database/db');
const {
  createSuccessResponse,
  createErrorResponse,
} = require('../../../src/utils/response');
const { strategy, authenticate } = require('../../../src/auth/jwt-middleware');
const { generateToken } = require('../../../src/utils/jwt');

// app properly handles the route
const { getUserById } = require('../../../src/routes/api/user/getUser');
const app = express();
app.use(express.json());
app.use(passport.initialize());
passport.use(strategy());
app.get('/v1/user/:id', authenticate(), getUserById); // GET /users/:id

// mock the database and response functions
jest.mock('../../../database/db');
jest.mock('../../../src/utils/response');

describe('GET /users/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return 200 and get an existing user', async () => {
    // Mock the database response
    pool.query.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          first_name: 'John',
          last_name: 'Doe',
          email: 'john.doe@example.com',
          role: 'Parent',
        },
      ],
    });

    const user = {
      userId: 1,
      firstName: 'Anh',
      lastName: 'Vu',
      email: 'user1@email.com',
      role: 'Parent',
    };
    const token = generateToken(user);

    const res = await request(app)
      .get('/v1/user/1')
      .set('Authorization', `Bearer ${token}`); // Include the token in the Authorization header

    expect(res.status).toBe(200);
    expect(pool.query).toHaveBeenCalledWith(
      'SELECT * FROM users WHERE user_id = $1',
      ['1']
    );
    expect(createSuccessResponse).toHaveBeenCalledWith({
      id: 1,
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      role: 'Parent',
    });
  });

  test('should return 500 if there is a database error', async () => {
    pool.query.mockRejectedValueOnce(new Error('Database error'));

    const user = {
      userId: 1,
      firstName: 'Anh',
      lastName: 'Vu',
      email: 'user1@email.com',
      role: 'Parent',
    };
    const token = generateToken(user);

    const res = await request(app)
      .get('/v1/user/1')
      .set('Authorization', `Bearer ${token}`); // Include the token in the Authorization header

    expect(res.status).toBe(500);
    expect(createErrorResponse).toHaveBeenCalledWith(
      500,
      'Internal server error'
    );
  });
});
