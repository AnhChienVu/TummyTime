// tests/unit/milestones/putMilestone.test.js
// Tests the PUT /milestones/:milestoneId route

const request = require('supertest');
const express = require('express');
const pool = require('../../../database/db');
const { createSuccessResponse, createErrorResponse } = require('../../../src/utils/response');

// app properly handles the route
const { updateMilestoneById } = require('../../../src/routes/api/milestones/putMilestone');
const app = express();
app.use(express.json());
app.put('/v1/milestones/:milestoneId', updateMilestoneById); // PUT /milestones/:milestoneId

// mock the database and response functions
jest.mock('../../../database/db');
jest.mock('../../../src/utils/response');

describe('PUT /milestones/:milestoneId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return 200 and update the milestone record', async () => {
    const updatedMilestone = {
      date: '2025-02-20',
      title: 'First Walk',
      details: 'Baby walked for the first time.',
    };

    pool.query.mockResolvedValueOnce({ rows: [updatedMilestone] });
    createSuccessResponse.mockReturnValue(updatedMilestone);

    const res = await request(app).put('/v1/milestones/1').send(updatedMilestone);

    expect(res.status).toBe(200);
    expect(pool.query).toHaveBeenCalledWith(
      'UPDATE milestones SET date = $1, title = $2, details = $3 WHERE milestone_id = $4 RETURNING *',
      ['2025-02-20', 'First Walk', 'Baby walked for the first time.', '1']
    );
    expect(res.body).toEqual(updatedMilestone);
  });

  test('should return 404 if the milestone record is not found', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    createErrorResponse.mockReturnValue({ error: 'Milestone record not found' });

    const res = await request(app).put('/v1/milestones/999').send({
      date: '2025-02-20',
      title: 'First Walk',
      details: 'Baby walked for the first time.',
    });

    expect(res.status).toBe(404);
    expect(createErrorResponse).toHaveBeenCalledWith(404, 'Milestone record not found');
  });

  test('should return 500 if there is an internal server error', async () => {
    pool.query.mockRejectedValueOnce(new Error('Database error'));
    createErrorResponse.mockReturnValue({ error: 'Internal server error' });

    const res = await request(app).put('/v1/milestones/1').send({
      date: '2025-02-20',
      title: 'First Walk',
      details: 'Baby walked for the first time.',
    });

    expect(res.status).toBe(500);
    expect(createErrorResponse).toHaveBeenCalledWith(500, 'Internal server error');
  });
});
