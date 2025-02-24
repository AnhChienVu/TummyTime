/**
 * File: tests/unit/baby/stool/getStool.test.js
 * Unit tests for GET /v1/baby/:babyId/stool
 */

const { getStoolEntries } = require('../../../../src/routes/api/baby/stool/getStool');
const { createSuccessResponse, createErrorResponse } = require('../../../../src/utils/response');
const pool = require('../../../../database/db');
const jwt = require('jsonwebtoken');

// Mocks for dependencies
jest.mock('../../../../database/db');
jest.mock('../../../../src/utils/response');

describe("getStoolEntries (unit tests)", () => {
  let req, res;
  beforeEach(() => {
    req = {
      params: { babyId: "1" },
      headers: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    // Clear mocks to avoid interference between tests
    jest.clearAllMocks();
  });

  test("should return 400 if babyId format is invalid", async () => {
    req.params.babyId = "abc"; // invalid babyId format
    await getStoolEntries(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(createErrorResponse).toHaveBeenCalledWith(400, 'Invalid babyId format');
  });

  test("should return 401 if no authorization header is provided", async () => {
    // Authorization header missing
    await getStoolEntries(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(createErrorResponse).toHaveBeenCalledWith(401, 'No authorization token provided');
  });

  test("should return 401 if token is missing after Bearer", async () => {
    req.headers.authorization = "Bearer "; // empty token case
    await getStoolEntries(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(createErrorResponse).toHaveBeenCalledWith(401, 'Invalid token format');
  });

  test("should return 401 if decoded token does not contain an email", async () => {
    req.headers.authorization = "Bearer validtoken";
    // Simulate token payload missing email property
    jest.spyOn(jwt, 'decode').mockReturnValue({ sub: "123" });
    await getStoolEntries(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(createErrorResponse).toHaveBeenCalledWith(401, 'Invalid token format');
  });

  test("should return 404 if user is not found in DB", async () => {
    req.headers.authorization = "Bearer validtoken";
    jest.spyOn(jwt, 'decode').mockReturnValue({ email: 'notfound@example.com' });
    // Simulate no user found
    pool.query.mockResolvedValueOnce({ rows: [] });
    await getStoolEntries(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(createErrorResponse).toHaveBeenCalledWith(404, 'User not found');
  });

  test("should return 403 if user lacks ownership", async () => {
    req.headers.authorization = "Bearer validtoken";
    jest.spyOn(jwt, 'decode').mockReturnValue({ email: 'parent@example.com' });
    // Return valid user for lookup
    pool.query.mockResolvedValueOnce({ rows: [{ user_id: 1 }] });
    // Simulate ownership check failure
    pool.query.mockResolvedValueOnce({ rows: [] });
    await getStoolEntries(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(createErrorResponse).toHaveBeenCalledWith(403, 'Forbidden');
  });

  test("should return 404 if no stool entries found", async () => {
    req.headers.authorization = "Bearer validtoken";
    jest.spyOn(jwt, 'decode').mockReturnValue({ email: 'parent@example.com' });
    // User lookup returns user_id 1
    pool.query.mockResolvedValueOnce({ rows: [{ user_id: 1 }] });
    // Ownership check passes
    pool.query.mockResolvedValueOnce({ rows: [{ user_id: 1, baby_id: 1 }] });
    // Simulate empty stool entries result
    pool.query.mockResolvedValueOnce({ rows: [] });
    await getStoolEntries(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(createErrorResponse).toHaveBeenCalledWith(404, 'No stool records found');
  });

  test("should return 200 with stool entries on happy path", async () => {
    req.headers.authorization = "Bearer validtoken";
    jest.spyOn(jwt, 'decode').mockReturnValue({ email: 'parent@example.com' });
    // Valid user lookup
    pool.query.mockResolvedValueOnce({ rows: [{ user_id: 1 }] });
    // Ownership check passes
    pool.query.mockResolvedValueOnce({ rows: [{ user_id: 1, baby_id: 1 }] });
    // Simulate valid stool entries
    const entries = [
      { stool_id: 1, baby_id: 1, timestamp: '2025-02-10T10:30:00Z', consistency: 'soft', color: 'yellow' },
      { stool_id: 2, baby_id: 1, timestamp: '2025-02-09T08:15:00Z', consistency: 'firm', color: 'brown' },
    ];
    pool.query.mockResolvedValueOnce({ rows: entries });
    createSuccessResponse.mockReturnValue({ status: 'ok', data: entries });
    await getStoolEntries(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(createSuccessResponse).toHaveBeenCalledWith(entries);
  });

  test("should return 500 on database error", async () => {
    req.headers.authorization = "Bearer validtoken";
    jest.spyOn(jwt, 'decode').mockReturnValue({ email: 'parent@example.com' });
    // Valid user lookup
    pool.query.mockResolvedValueOnce({ rows: [{ user_id: 1 }] });
    // Ownership check passes
    pool.query.mockResolvedValueOnce({ rows: [{ user_id: 1, baby_id: 1 }] });
    // Simulate database failure during stool query
    pool.query.mockRejectedValueOnce(new Error('DB crash'));
    createErrorResponse.mockReturnValue({ error: 'Internal server error' });
    await getStoolEntries(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(createErrorResponse).toHaveBeenCalledWith(500, 'Internal server error');
  });
});
