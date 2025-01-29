// tests/unit/growth/putGrowth.test.js
// Tests the PUT /growth/:growthId route

const request = require('supertest');
const express = require('express');
const pool = require('../../../database/db');
const { createSuccessResponse, createErrorResponse } = require('../../../src/utils/response');

// app properly handles the route
const { updateGrowthById } = require('../../../src/routes/api/growth/putGrowth');
const app = express();
app.use(express.json());
app.put('/v1/growth/:growthId', updateGrowthById); // PUT /growth/:growthId

// mock the database and response functions
jest.mock('../../../database/db');
jest.mock('../../../src/utils/response');

// Test PUT /growth/:growthId
describe('PUT /growth/:growthId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return 200 and update the growth record', async () => {
    const updatedGrowthRecord = {
      date: '2025-01-02',
      height: 52,
      weight: 3.8,
      notes: 'Updated growth record',
    };

    pool.query.mockResolvedValueOnce({ rows: [updatedGrowthRecord] });
    createSuccessResponse.mockReturnValue(updatedGrowthRecord);

    const res = await request(app).put('/v1/growth/1').send(updatedGrowthRecord);

    expect(res.status).toBe(200);
    expect(pool.query).toHaveBeenCalledWith(
      'UPDATE growth SET date = $1, height = $2, weight = $3, notes = $4 WHERE growth_id = $5 RETURNING *',
      ['2025-01-02', 52, 3.8, 'Updated growth record', '1']
    );
    expect(res.body).toEqual(updatedGrowthRecord);
  });

  test('should return 404 if the growth record is not found', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    createErrorResponse.mockReturnValue({ error: 'Growth record not found' });

    const res = await request(app).put('/v1/growth/999').send({
      date: '2025-01-02',
      height: 52,
      weight: 3.8,
      notes: 'Updated growth record',
    });

    expect(res.status).toBe(404);
    expect(createErrorResponse).toHaveBeenCalledWith(404, 'Growth record not found');
  });
});
