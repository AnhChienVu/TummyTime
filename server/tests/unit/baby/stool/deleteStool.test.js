/**
 * File: tests/unit/baby/stool/deleteStool.test.js
 * Unit tests for DELETE /v1/baby/:babyId/stool/:stoolId
 */

const { deleteStoolEntry } = require('../../../../src/routes/api/baby/stool/deleteStool');
const { createSuccessResponse, createErrorResponse } = require('../../../../src/utils/response');
const pool = require('../../../../database/db');
const jwt = require('jsonwebtoken');

jest.mock('../../../../database/db');
jest.mock('../../../../src/utils/response');

const buildRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('deleteStoolEntry direct invocation', () => {
  let req, res;
  beforeEach(() => {
    req = {
      params: { babyId: '1', stoolId: '1' },
      headers: {},
    };
    res = buildRes();
    jest.clearAllMocks();
    pool.query.mockReset();
    createErrorResponse.mockReset();
    createSuccessResponse.mockReset();
  });

  test('returns 400 for invalid babyId', async () => {
    req.params.babyId = 'abc';
    createErrorResponse.mockReturnValue({ error: 'Invalid babyId format' });
    await deleteStoolEntry(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid babyId format' });
  });

  test('returns 400 for invalid stoolId', async () => {
    req.params.stoolId = 'xyz';
    createErrorResponse.mockReturnValue({ error: 'Invalid stoolId format' });
    await deleteStoolEntry(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid stoolId format' });
  });

  test('returns 401 for missing authorization header', async () => {
    // No req.headers.authorization provided
    createErrorResponse.mockReturnValue({ error: 'No authorization token provided' });
    await deleteStoolEntry(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'No authorization token provided' });
  });

  test('returns 401 for missing token after "Bearer"', async () => {
    req.headers.authorization = 'Bearer ';
    createErrorResponse.mockReturnValue({ error: 'Invalid token format' });
    await deleteStoolEntry(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token format' });
  });

  test('returns 401 for token with no email in payload', async () => {
    req.headers.authorization = 'Bearer sometoken';
    // Stub jwt.decode to return an object without email
    jwt.decode = jest.fn(() => ({}));
    createErrorResponse.mockReturnValue({ error: 'Invalid token format' });
    await deleteStoolEntry(req, res);
    expect(jwt.decode).toHaveBeenCalledWith('sometoken');
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token format' });
  });

  test('returns 404 if user not found in DB', async () => {
    req.headers.authorization = 'Bearer sometoken';
    jwt.decode = jest.fn(() => ({ email: 'test@example.com' }));
    // Simulate user lookup returning no rows
    pool.query.mockResolvedValueOnce({ rows: [] });
    createErrorResponse.mockReturnValue({ error: 'User not found' });
    await deleteStoolEntry(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
  });

  test('returns 403 if ownership not found', async () => {
    req.headers.authorization = 'Bearer sometoken';
    jwt.decode = jest.fn(() => ({ email: 'test@example.com' }));
    // 1) User lookup returns a valid user
    pool.query.mockResolvedValueOnce({ rows: [{ user_id: 2 }] });
    // 2) Ownership check returns no rows
    pool.query.mockResolvedValueOnce({ rows: [] });
    createErrorResponse.mockReturnValue({ error: 'Forbidden' });
    await deleteStoolEntry(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden' });
  });

  test('returns 404 if baby not found', async () => {
    req.headers.authorization = 'Bearer sometoken';
    jwt.decode = jest.fn(() => ({ email: 'test@example.com' }));
    // 1) User lookup returns a valid user
    pool.query.mockResolvedValueOnce({ rows: [{ user_id: 2 }] });
    // 2) Ownership check returns a result (ownership exists)
    pool.query.mockResolvedValueOnce({ rows: [{ some: 'data' }] });
    // 3) Baby existence check returns no rows
    pool.query.mockResolvedValueOnce({ rows: [] });
    createErrorResponse.mockReturnValue({ error: 'Baby not found' });
    await deleteStoolEntry(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Baby not found' });
  });

  test('returns 404 if stool entry not found', async () => {
    req.headers.authorization = 'Bearer sometoken';
    jwt.decode = jest.fn(() => ({ email: 'test@example.com' }));
    // 1) User lookup
    pool.query.mockResolvedValueOnce({ rows: [{ user_id: 2 }] });
    // 2) Ownership check
    pool.query.mockResolvedValueOnce({ rows: [{ some: 'data' }] });
    // 3) Baby exists
    pool.query.mockResolvedValueOnce({ rows: [{ baby_id: 1 }] });
    // 4) Stool entry check returns empty
    pool.query.mockResolvedValueOnce({ rows: [] });
    createErrorResponse.mockReturnValue({ error: 'Stool entry not found' });
    await deleteStoolEntry(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Stool entry not found' });
  });

  test('successful deletion returns 200', async () => {
    req.headers.authorization = 'Bearer sometoken';
    jwt.decode = jest.fn(() => ({ email: 'test@example.com' }));
    // 1) User lookup returns a valid user
    pool.query.mockResolvedValueOnce({ rows: [{ user_id: 2 }] });
    // 2) Ownership check returns valid data
    pool.query.mockResolvedValueOnce({ rows: [{ some: 'data' }] });
    // 3) Baby exists
    pool.query.mockResolvedValueOnce({ rows: [{ baby_id: 1 }] });
    // 4) Stool entry exists
    pool.query.mockResolvedValueOnce({ rows: [{ stool_id: 1 }] });
    // 5) Deletion query (we don't check its result since we don't use it)
    pool.query.mockResolvedValueOnce({});
    createSuccessResponse.mockReturnValue({ message: 'Stool entry deleted successfully' });
    await deleteStoolEntry(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Stool entry deleted successfully' });
  });

  test('returns 500 on error in try block', async () => {
    req.headers.authorization = 'Bearer sometoken';
    jwt.decode = jest.fn(() => ({ email: 'test@example.com' }));
    // 1) User lookup
    pool.query.mockResolvedValueOnce({ rows: [{ user_id: 2 }] });
    // 2) Ownership check
    pool.query.mockResolvedValueOnce({ rows: [{ some: 'data' }] });
    // 3) Baby exists
    pool.query.mockResolvedValueOnce({ rows: [{ baby_id: 1 }] });
    // 4) Stool entry exists
    pool.query.mockResolvedValueOnce({ rows: [{ stool_id: 1 }] });
    // 5) Simulate an error thrown during the deletion query
    pool.query.mockRejectedValueOnce(new Error('DB error'));
    createErrorResponse.mockReturnValue({ error: 'Internal server error' });
    await deleteStoolEntry(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });
});
