// tests/unit/users/putUsers.test.js
// Tests the PUT /users/:id route

const request = require('supertest');
const express = require('express');
const { updateUserById } = require('../../../src/routes/api/users/putUsers');
const pool = require('../../../database/db');
const { createSuccessResponse, createErrorResponse } = require('../../../src/utils/response');

// app properly handles the route
const app = express();
app.use(express.json());
app.put('/v1/users/:id', updateUserById);

// mock the database and response functions
jest.mock('../../../database/db');
jest.mock('../../../src/utils/response');

describe('PUT /users/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return 200 and update the old user', async () => {
    // Mock the database response
    pool.query.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          first_name: 'John',
          last_name: 'Doe',
          email: 'john.doe@example.com',
          role: 'Parent',
          created_at: '2021-01-01T00:00:00.000Z',
        },
      ],
    });

    const res = await request(app).put('/v1/users/1').send({
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      role: 'Parent',
      created_at: '2021-01-01T00:00:00.000Z',
    });

    expect(res.status).toBe(200);
    expect(pool.query).toHaveBeenCalledWith(
      'UPDATE users SET first_name = $1, last_name = $2, email = $3, role = $4, created_at = $5 WHERE id = $6 RETURNING *',
      ['John', 'Doe', 'john.doe@example.com', 'Parent', '2021-01-01T00:00:00.000Z', '1']
    );
    expect(createSuccessResponse).toHaveBeenCalledWith({
      id: 1,
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      role: 'Parent',
      created_at: '2021-01-01T00:00:00.000Z',
    });
  });

  test('should return 500 if there is a database error', async () => {
    pool.query.mockRejectedValueOnce(new Error('Database error'));

    const res = await request(app).put('/v1/users/1').send({
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      role: 'Parent',
      created_at: '2021-01-01T00:00:00.000Z',
    });

    expect(res.status).toBe(500);
    expect(createErrorResponse).toHaveBeenCalledWith(500, 'Internal server error');
  });
});
