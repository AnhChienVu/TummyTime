// tests/unit/growth/deleteGrowth.test.js
// Tests the DELETE /baby/:babyId/growth/:growthId route

const request = require('supertest');
const express = require('express');
const pool = require('../../../database/db');
const { createSuccessResponse, createErrorResponse } = require('../../../src/utils/response');

// app properly handles the route
const { deleteGrowthById } = require('../../../src/routes/api/growth/deleteGrowth');
const app = express();
app.use(express.json());
app.delete('/v1/baby/:babyId/growth/:growthId', deleteGrowthById); // DELETE /baby/:babyId/growth/:growthId

// mock the database and response functions
jest.mock('../../../database/db');
jest.mock('../../../src/utils/response');

// Test DELETE /baby/:babyId/growth/:growthId
describe('DELETE /baby/:babyId/growth/:growthId', () => {
  test('should return 200 and delete the growth record', async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 1 });
    createSuccessResponse.mockReturnValue({ success: true });

    const res = await request(app).delete('/v1/baby/1/growth/1');

    expect(res.status).toBe(200);
    expect(pool.query).toHaveBeenCalledWith('DELETE FROM growth WHERE growth_id = $1', ['1']);
    expect(createSuccessResponse).toHaveBeenCalled();
  });

  test('should return 404 if the growth record is not found', async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 0 });
    createErrorResponse.mockReturnValue({ error: 'Growth record not found' });

    const res = await request(app).delete('/v1/baby/1/growth/999');

    expect(res.status).toBe(404);
    expect(createErrorResponse).toHaveBeenCalledWith(404, 'Growth record not found');
  });

  test('should return 500 if there is a database error', async () => {
    pool.query.mockRejectedValueOnce(new Error('Database error'));
    createErrorResponse.mockReturnValue({ error: 'Internal server error' });

    const res = await request(app).delete('/v1/baby/1/growth/1');

    expect(res.status).toBe(500);
    expect(createErrorResponse).toHaveBeenCalledWith(500, 'Internal server error');
  });
});
