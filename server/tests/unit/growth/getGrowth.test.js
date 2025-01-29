// tests/unit/growth/getGrowth.test.js
// Tests the GET /growth/:growthId route

const request = require('supertest');
const express = require('express');
const pool = require('../../../database/db');
const { createSuccessResponse, createErrorResponse } = require('../../../src/utils/response');

// app properly handles the route
const { getGrowthById } = require('../../../src/routes/api/growth/getGrowth');
const app = express();
app.use(express.json());
app.get('/v1/growth/:growthId', getGrowthById); // GET /growth/:growthId

// mock the database and response functions
jest.mock('../../../database/db');
jest.mock('../../../src/utils/response');

// Test DELETE /growth/:growthId
describe('GET /growth/:growthId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return 200 and all growth records for the given ID', async () => {
    const mockGrowthRecords = [
      { growth_id: 1, baby_id: 1, date: '2025-01-01', height: 50, weight: 3.5, notes: 'First' },
      { growth_id: 1, baby_id: 1, date: '2025-02-01', height: 52, weight: 4.0, notes: 'Second' },
    ];

    pool.query.mockResolvedValueOnce({ rows: mockGrowthRecords });
    createSuccessResponse.mockReturnValue(mockGrowthRecords);

    const res = await request(app).get('/v1/growth/1');

    expect(res.status).toBe(200);
    expect(pool.query).toHaveBeenCalledWith('SELECT * FROM growth WHERE growth_id = $1', ['1']);
    expect(res.body).toEqual(mockGrowthRecords);
  });

  test('should return 404 if no growth records are found', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    createErrorResponse.mockReturnValue({ error: 'Growth record not found' });

    const res = await request(app).get('/v1/growth/999');

    expect(res.status).toBe(404);
    expect(createErrorResponse).toHaveBeenCalledWith(404, 'Growth record not found');
  });

  test('should return 500 if there is a database error', async () => {
    pool.query.mockRejectedValueOnce(new Error('Database error'));
    createErrorResponse.mockReturnValue({ error: 'Internal server error' });

    const res = await request(app).get('/v1/growth/1');

    expect(res.status).toBe(500);
    expect(createErrorResponse).toHaveBeenCalledWith(500, 'Internal server error');
  });
});
