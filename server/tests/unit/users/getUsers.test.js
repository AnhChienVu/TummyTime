// tests/unit/users/getUsers.test.js
// Tests the GET /users/:id route

const request = require('supertest');
const express = require('express');
const pool = require('../../../database/db');
const { createSuccessResponse, createErrorResponse } = require('../../../src/utils/response');

// app properly handles the route
const { getUserById } = require('../../../src/routes/api/users/getUsers');
const app = express();
app.use(express.json());
app.get('/v1/users/:id', getUserById); // GET /users/:id

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

    const res = await request(app).get('/v1/users/1');

    expect(res.status).toBe(200);
    expect(pool.query).toHaveBeenCalledWith('SELECT * FROM users WHERE id = $1', ['1']);
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

    const res = await request(app).get('/v1/users/1');

    expect(res.status).toBe(500);
    expect(createErrorResponse).toHaveBeenCalledWith(500, 'Internal server error');
  });
});
