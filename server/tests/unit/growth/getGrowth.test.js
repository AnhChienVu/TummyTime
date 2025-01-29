// tests/unit/growth/getGrowth.test.js
// Tests the GET /baby/[:babyId]/growth route

const request = require('supertest');
const express = require('express');
const pool = require('../../../database/db');
const { createSuccessResponse, createErrorResponse } = require('../../../src/utils/response');

// app properly handles the route
const { getAllGrowth } = require('../../../src/routes/api/growth/getGrowth');
const app = express();
app.use(express.json());
app.get('/v1/baby/:babyId/growth', getAllGrowth); // GET /baby/[:babyId]/growth

// mock the database and response functions
jest.mock('../../../database/db');
jest.mock('../../../src/utils/response');

// Test GET /baby/:babyId/growth
describe('GET /baby/:babyId/growth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return 200 and an array of growth records if multiple exist', async () => {
    const mockGrowthRecords = [
      {
        growth_id: 1,
        baby_id: 1,
        date: '2025-01-01',
        height: 50,
        weight: 3.5,
        notes: 'First growth record',
      },
      {
        growth_id: 2,
        baby_id: 1,
        date: '2025-02-01',
        height: 55,
        weight: 4.2,
        notes: 'Second growth record',
      },
    ];

    pool.query.mockResolvedValueOnce({ rows: mockGrowthRecords });

    // Fix: Mock `createSuccessResponse` to match actual implementation
    createSuccessResponse.mockReturnValue({ status: 'ok', data: mockGrowthRecords });

    const res = await request(app).get('/v1/baby/1/growth');

    expect(res.status).toBe(200);
    expect(pool.query).toHaveBeenCalledWith('SELECT * FROM growth WHERE baby_id = $1', ['1']);

    // Fix: Expect correct response format
    expect(res.body).toEqual({
      status: 'ok',
      data: mockGrowthRecords,
    });
  });

  test('should return 404 if no growth records are found', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    createErrorResponse.mockReturnValue({ error: 'No growth records found for [babyId] 999' });

    const res = await request(app).get('/v1/baby/999/growth');

    expect(res.status).toBe(404);
    expect(createErrorResponse).toHaveBeenCalledWith(
      404,
      'No growth records found for [babyId] 999'
    );
    expect(res.body).toEqual({ error: 'No growth records found for [babyId] 999' });
  });

  test('should return 500 if there is a database error', async () => {
    pool.query.mockRejectedValueOnce(new Error('Database error'));
    createErrorResponse.mockReturnValue({ error: 'Internal server error' });

    const res = await request(app).get('/v1/baby/1/growth');

    expect(res.status).toBe(500);
    expect(createErrorResponse).toHaveBeenCalledWith(500, 'Internal server error');
    expect(res.body).toEqual({ error: 'Internal server error' });
  });
});
