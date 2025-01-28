// tests/unit/milestones/postMilestone.test.js
// Tests the POST /milestones route

const request = require('supertest');
const express = require('express');
const pool = require('../../../database/db');
const { createSuccessResponse, createErrorResponse } = require('../../../src/utils/response');

// app properly handles the route
const { createMilestone } = require('../../../src/routes/api/milestones/postMilestone');
const app = express();
app.use(express.json());
app.post('/v1/milestones', createMilestone); // POST /milestones

// mock the database and response functions
jest.mock('../../../database/db');
jest.mock('../../../src/utils/response');

// POST /milestones
describe('POST /milestones', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return 201 and create a new milestone', async () => {
    const newMilestone = {
      baby_id: 1,
      date: '2025-02-20',
      title: 'First Word',
      details: 'Baby said their first word.',
    };

    pool.query.mockResolvedValueOnce({ rows: [newMilestone] });
    createSuccessResponse.mockReturnValue(newMilestone);

    const res = await request(app).post('/v1/milestones').send(newMilestone);

    expect(res.status).toBe(201);
    expect(pool.query).toHaveBeenCalledWith(
      'INSERT INTO milestones (baby_id, date, title, details) VALUES ($1, $2, $3, $4) RETURNING *',
      [1, '2025-02-20', 'First Word', 'Baby said their first word.']
    );
    expect(res.body).toEqual(newMilestone);
  });

  test('should return 500 for internal server error', async () => {
    const newMilestone = {
      baby_id: 1,
      date: '2025-02-20',
      title: 'First Word',
      details: 'Baby said their first word.',
    };

    pool.query.mockRejectedValueOnce(new Error('Database error'));
    createErrorResponse.mockReturnValue({ error: 'Internal server error' });

    const res = await request(app).post('/v1/milestones').send(newMilestone);

    expect(res.status).toBe(500);
    expect(createErrorResponse).toHaveBeenCalledWith(500, 'Internal server error');
  });
});
