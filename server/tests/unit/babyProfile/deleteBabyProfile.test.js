// tests/unit/babyProfile/deleteBabyProfile.test.js
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
const deleteBaby = require('../../../src/routes/api/baby/babyProfile/deleteBabyProfile');
const app = express();
app.use(express.json());
app.use(passport.initialize());
passport.use(strategy());
app.delete('/v1/baby/:baby_id/deleteBabyProfile', authenticate(), deleteBaby);

jest.mock('../../../database/db');
jest.mock('../../../src/utils/response');

describe('DELETE v1/baby/:baby_id/deleteBabyProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return 200 and delete the baby profile', async () => {
    const babyToDelete = {
      baby_id: 1,
      user_id: 1,
    };

    pool.query
      .mockResolvedValueOnce({
        rows: [{ user_id: 1, baby_id: 1 }], // Mock user authorization check
      })
      .mockResolvedValueOnce({
        rowCount: 1, // Mock successful deletion
      })
      .mockResolvedValueOnce({
        rowCount: 1, // Mock successful deletion
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
      .delete(`/v1/baby/${babyToDelete.baby_id}/deleteBabyProfile`)
      .set('Authorization', `Bearer ${token}`)
      .send({ user_id: babyToDelete.user_id });

    expect(res.status).toBe(200);
    expect(createSuccessResponse).toHaveBeenCalledWith(
      'Baby profile deleted successfully'
    );
  });

  test('should return 403 when user is not authorized', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [], // Mock unauthorized user
    });

    const user = {
      userId: 2,
      firstName: 'Test',
      lastName: 'User',
      email: 'user2@email.com',
      role: 'Parent',
    };
    const token = generateToken(user);

    const res = await request(app)
      .delete('/v1/baby/1/deleteBabyProfile')
      .set('Authorization', `Bearer ${token}`)
      .send({ user_id: 2 });

    expect(res.status).toBe(403);
    expect(createErrorResponse).toHaveBeenCalledWith(
      'Not authorized to delete this baby profile'
    );
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
      .delete('/v1/baby/1/deleteBabyProfile')
      .set('Authorization', `Bearer ${token}`)
      .send({ user_id: 1 });

    expect(res.status).toBe(500);
    expect(createErrorResponse).toHaveBeenCalledWith('Internal server error');
  });

  test('should return 400 when missing required parameters', async () => {
    const user = {
      userId: 1,
      firstName: 'Anh',
      lastName: 'Vu',
      email: 'user1@email.com',
      role: 'Parent',
    };
    const token = generateToken(user);

    const res = await request(app)
      .delete('/v1/baby/1/deleteBabyProfile')
      .set('Authorization', `Bearer ${token}`)
      .send({}); // Missing user_id

    expect(res.status).toBe(400);
    expect(createErrorResponse).toHaveBeenCalledWith(
      'Missing required parameters'
    );
  });
});
