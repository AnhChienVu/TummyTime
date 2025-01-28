// tests/unit/milestones/deleteMilestone.test.js
// Tests the DELETE /milestones/:milestoneId route

const request = require('supertest');
const express = require('express');
const pool = require('../../../database/db');
const { createSuccessResponse, createErrorResponse } = require('../../../src/utils/response');

// app properly handles the route
const { deleteMilestoneById } = require('../../../src/routes/api/milestones/deleteMilestone');
const app = express();
app.use(express.json());
app.delete('/v1/milestones/:milestoneId', deleteMilestoneById); // DELETE /milestones/:milestoneId

// mock the database and response functions
jest.mock('../../../database/db');
jest.mock('../../../src/utils/response');

// DELETE /milestones/:milestoneId
describe('DELETE /milestones/:milestoneId', () => {
  describe('Milestones API', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('should return 200 when a milestone is successfully deleted', async () => {
      pool.query.mockResolvedValueOnce({ rowCount: 1 });
      createSuccessResponse.mockReturnValue({ message: 'Milestone deleted successfully' });

      const res = await request(app).delete('/v1/milestones/1');

      expect(res.status).toBe(200);
      expect(pool.query).toHaveBeenCalledWith('DELETE FROM milestones WHERE milestone_id = $1', [
        '1',
      ]);
      expect(res.body).toEqual({ message: 'Milestone deleted successfully' });
    });

    test('should return 404 when the milestone is not found', async () => {
      pool.query.mockResolvedValueOnce({ rowCount: 0 });
      createErrorResponse.mockReturnValue({ error: 'Milestone record not found' });

      const res = await request(app).delete('/v1/milestones/999');

      expect(res.status).toBe(404);
      expect(createErrorResponse).toHaveBeenCalledWith(404, 'Milestone record not found');
    });

    test('should return 500 for internal server error', async () => {
      pool.query.mockRejectedValueOnce(new Error('Database error'));
      createErrorResponse.mockReturnValue({ error: 'Internal server error' });

      const res = await request(app).delete('/v1/milestones/1');

      expect(res.status).toBe(500);
      expect(createErrorResponse).toHaveBeenCalledWith(500, 'Internal server error');
    });
  });
});
