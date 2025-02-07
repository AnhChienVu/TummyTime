// tests/unit/milestones/getMilestone.test.js
// Tests the GET /v1/baby/:baby_id/getMilestones route

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
const {
  getMilestoneByBabyId,
} = require('../../../src/routes/api/milestones/getMilestones');

const app = express();
app.use(express.json());
app.use(passport.initialize());
passport.use(strategy());
app.get(
  '/v1/baby/:baby_id/getMilestones',
  authenticate(),
  getMilestoneByBabyId
);

// mock the database and response functions
jest.mock('../../../database/db');
jest.mock('../../../src/utils/response');

// GET /milestones/:milestoneId
describe('GET /v1/baby/:baby_id/getMilestones', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return 200 and the milestone record', async () => {
    const milestone = {
      milestone_id: 1,
      baby_id: 1,
      date: '2025-02-20',
      title: 'First Walk',
      details: 'Baby walked for the first time.',
    };

    pool.query.mockResolvedValueOnce({ rows: [milestone] });
    createSuccessResponse.mockReturnValue(milestone);

    const user = {
      userId: 1,
      firstName: 'Anh',
      lastName: 'Vu',
      email: 'user1@email.com',
      role: 'Parent',
    };
    const token = generateToken(user);

    const res = await request(app)
      .get('/v1/baby/1/getMilestones')
      .set('Authorization', `Bearer ${token}`); // Include the token in the Authorization header

    expect(res.status).toBe(200);
    expect(pool.query).toHaveBeenCalledWith(
      'SELECT * FROM milestones WHERE baby_id = $1',
      ['1']
    );
    expect(res.body).toEqual(milestone);
  });

  test('should return 404 when there is no milestones for baby', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    createErrorResponse.mockReturnValue({
      error: 'Milestone record not found',
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
      .get('/v1/baby/1/getMilestones')
      .set('Authorization', `Bearer ${token}`); // Include the token in the Authorization header

    expect(res.status).toBe(404);
    expect(createErrorResponse).toHaveBeenCalledWith(
      404,
      'Milestone record not found'
    );
  });

  test('should return 500 for internal server error', async () => {
    pool.query.mockRejectedValueOnce(new Error('Database error'));
    createErrorResponse.mockReturnValue({ error: 'Internal server error' });

    const user = {
      userId: 1,
      firstName: 'Anh',
      lastName: 'Vu',
      email: 'user1@email.com',
      role: 'Parent',
    };
    const token = generateToken(user);

    const res = await request(app)
      .get('/v1/baby/1/getMilestones')
      .set('Authorization', `Bearer ${token}`); // Include the token in the Authorization header
    expect(res.status).toBe(500);
    expect(createErrorResponse).toHaveBeenCalledWith(
      500,
      'Internal server error'
    );
  });
});
