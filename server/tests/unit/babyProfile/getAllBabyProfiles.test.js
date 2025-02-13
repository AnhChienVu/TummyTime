// tests/unit/babyProfile/getAllBabyProfiles.test.js
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

const getAllBabyProfiles = require('../../../src/routes/api/baby/babyProfile/getAllBabyProfiles');
const app = express();
app.use(express.json());
app.use(passport.initialize());
passport.use(strategy());
app.get(
  '/v1/user/:user_id/getAllBabyProfiles',
  authenticate(),
  getAllBabyProfiles
);

jest.mock('../../../database/db');
jest.mock('../../../src/utils/response');

describe('GET v1/user/:user_id/getAllBabyProfiles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return 200 and all baby profiles for the user', async () => {
    const mockBabies = [
      {
        baby_id: 1,
        first_name: 'John',
        last_name: 'Doe',
        gender: 'boy',
        weight: 10,
      },
      {
        baby_id: 2,
        first_name: 'Jane',
        last_name: 'Doe',
        gender: 'girl',
        weight: 8,
      },
    ];
    pool.query.mockResolvedValueOnce({
      rows: mockBabies,
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
      .get('/v1/user/1/getAllBabyProfiles')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(createSuccessResponse).toHaveBeenCalledWith({ babies: mockBabies });
    // expect(pool.query).toHaveBeenCalledWith(expect.any(String), [user.userId]);
  });

  test('should return 404 when no babies found for user', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [],
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
      .get('/v1/user/1/getAllBabyProfiles')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(createErrorResponse).toHaveBeenCalledWith(
      'No baby profiles found for this user'
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
      .get('/v1/user/1/getAllBabyProfiles')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(500);
    expect(createErrorResponse).toHaveBeenCalledWith('Internal server error');
  });

  test('should return 400 when user_id param is missing', async () => {
    const user = {
      userId: 1,
      firstName: 'Anh',
      lastName: 'Vu',
      email: 'user1@email.com',
      role: 'Parent',
    };
    const token = generateToken(user);

    const res = await request(app)
      .get('/v1/user/undefined/getAllBabyProfiles')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(createErrorResponse).toHaveBeenCalledWith(
      'Missing user_id parameter'
    );
  });

  test('should return 400 when user_id is not a valid number', async () => {
    const user = {
      userId: 1,
      firstName: 'Anh',
      lastName: 'Vu',
      email: 'user1@email.com',
      role: 'Parent',
    };
    const token = generateToken(user);

    const res = await request(app)
      .get('/v1/user/invalid/getAllBabyProfiles')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(createErrorResponse).toHaveBeenCalledWith(
      'Invalid user_id parameter'
    );
  });
});
