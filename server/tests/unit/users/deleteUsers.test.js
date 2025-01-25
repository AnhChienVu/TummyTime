// tests/unit/users/deleteUsers.test.js
// Tests the DELETE /users/:id route

const request = require('supertest');
const express = require('express');
const pool = require('../../../database/db');
const { createSuccessResponse, createErrorResponse } = require('../../../src/utils/response');

// app properly handles the route
const { deleteUserById } = require('../../../src/routes/api/users/deleteUsers');
const app = express();
app.use(express.json());
app.delete('/v1/users/:id', deleteUserById); // DELETE /users/:id

// mock the database and response functions
jest.mock('../../../database/db');
jest.mock('../../../src/utils/response');

describe('DELETE /users/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return 200 and delete the old user', async () => {
    // Mock the database response
    pool.query.mockResolvedValueOnce({
      rowCount: 1, // simulate that one row was deleted
    });

    const res = await request(app).delete('/v1/users/1');

    expect(res.status).toBe(200);
    expect(pool.query).toHaveBeenCalledWith('DELETE FROM users WHERE id = $1', ['1']);
    expect(createSuccessResponse).toHaveBeenCalledWith();
  });

  test('should return 500 if there is a database error', async () => {
    pool.query.mockRejectedValueOnce(new Error('Database error'));

    const res = await request(app).delete('/v1/users/1');

    expect(res.status).toBe(500);
    expect(createErrorResponse).toHaveBeenCalledWith(500, 'Internal server error');
  });
});
