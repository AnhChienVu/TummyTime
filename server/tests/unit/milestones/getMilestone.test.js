// tests/unit/milestones/getMilestone.test.js
// Tests the GET /milestones/:milestoneId route

const request = require('supertest');
const express = require('express');
const pool = require('../../../database/db');
const { createSuccessResponse, createErrorResponse } = require('../../../src/utils/response');

// app properly handles the route
const { getMilestoneById } = require('../../../src/routes/api/milestones/getMilestone');
const app = express();
app.use(express.json());
app.get('/v1/milestones/:milestoneId', getMilestoneById); // GET /milestones/:milestoneId

// mock the database and response functions
jest.mock('../../../database/db');
jest.mock('../../../src/utils/response');

// GET /milestones/:milestoneId
describe('GET /milestones/:milestoneId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return 200 and the milestone record', async () => {
    const milestone = {
      milestone_id: 1,
      date: '2025-02-20',
      title: 'First Walk',
      details: 'Baby walked for the first time.',
    };

    pool.query.mockResolvedValueOnce({ rows: [milestone] });
    createSuccessResponse.mockReturnValue(milestone);

    const res = await request(app).get('/v1/milestones/1');

    expect(res.status).toBe(200);
    expect(pool.query).toHaveBeenCalledWith('SELECT * FROM milestones WHERE milestone_id = $1', [
      '1',
    ]);
    expect(res.body).toEqual(milestone);
  });

  test('should return 404 when the milestone is not found', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    createErrorResponse.mockReturnValue({ error: 'Milestone record not found' });

    const res = await request(app).get('/v1/milestones/999');

    expect(res.status).toBe(404);
    expect(createErrorResponse).toHaveBeenCalledWith(404, 'Milestone record not found');
  });

  test('should return 500 for internal server error', async () => {
    pool.query.mockRejectedValueOnce(new Error('Database error'));
    createErrorResponse.mockReturnValue({ error: 'Internal server error' });

    const res = await request(app).get('/v1/milestones/1');

    expect(res.status).toBe(500);
    expect(createErrorResponse).toHaveBeenCalledWith(500, 'Internal server error');
  });
});
