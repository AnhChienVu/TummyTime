/**
 * File: tests/unit/baby/stool/putStool.test.js
 * Unit tests for PUT /v1/baby/:babyId/stool/:stoolId
 */

const request = require('supertest');
const express = require('express');
const passport = require('passport');

const pool = require('../../../../database/db');
const { createSuccessResponse, createErrorResponse } = require('../../../../src/utils/response');
const { strategy, authenticate } = require('../../../../src/auth/jwt-middleware');
const { generateToken } = require('../../../../src/utils/jwt');

const jwt = require('jsonwebtoken');
const { updateStoolEntry } = require('../../../../src/routes/api/baby/stool/putStool');

const app = express();
app.use(express.json());
app.use(passport.initialize());
passport.use(strategy());

// Register route with authentication middleware for Supertest tests
app.put('/v1/baby/:babyId/stool/:stoolId', authenticate(), updateStoolEntry);

jest.mock('../../../../database/db');
jest.mock('../../../../src/utils/response');

describe('PUT /v1/baby/:babyId/stool/:stoolId via Supertest', () => {
  let token;
  beforeAll(() => {
    const user = { userId: 1, email: 'parent@example.com', role: 'Parent' };
    token = generateToken(user);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns 200 on successful update', async () => {
    // Queries will run in order:
    // 1: user lookup, 2: ownership check, 3: baby existence,
    // 4: stool existence, 5: update query
    pool.query
      .mockResolvedValueOnce({ rows: [{ user_id: 1 }] }) // user lookup
      .mockResolvedValueOnce({ rows: [{ user_id: 1, baby_id: 1 }] }) // ownership check
      .mockResolvedValueOnce({ rows: [{ baby_id: 1 }] }) // baby exists
      .mockResolvedValueOnce({ rows: [{ stool_id: 10, baby_id: 1 }] }) // stool entry exists
      .mockResolvedValueOnce({
        rows: [{
          stool_id: 10,
          baby_id: 1,
          color: 'brown',
          consistency: 'hard',
          notes: 'updated',
          timestamp: '2025-03-01T12:00:00Z'
        }]
      }); // update query

    createSuccessResponse.mockReturnValue({
      stool_id: 10,
      baby_id: 1,
      color: 'brown',
      consistency: 'hard',
      notes: 'updated',
      timestamp: '2025-03-01T12:00:00Z'
    });

    const res = await request(app)
      .put('/v1/baby/1/stool/10')
      .set('Authorization', `Bearer ${token}`)
      .send({ color: 'brown', consistency: 'hard', notes: 'updated', timestamp: '2025-03-01T12:00:00Z' });

    expect(res.status).toBe(200);
    expect(createSuccessResponse).toHaveBeenCalledWith({
      stool_id: 10,
      baby_id: 1,
      color: 'brown',
      consistency: 'hard',
      notes: 'updated',
      timestamp: '2025-03-01T12:00:00Z'
    });
  });

  test('returns 400 if babyId or stoolId is invalid', async () => {
    createErrorResponse.mockReturnValue({ error: 'Invalid babyId format' });
    let res = await request(app)
      .put('/v1/baby/abc/stool/10')
      .set('Authorization', `Bearer ${token}`)
      .send({ color: 'brown' });
    expect(res.status).toBe(400);

    createErrorResponse.mockReturnValue({ error: 'Invalid stoolId format' });
    res = await request(app)
      .put('/v1/baby/1/stool/xyz')
      .set('Authorization', `Bearer ${token}`)
      .send({ color: 'brown' });
    expect(res.status).toBe(400);
  });

  test('returns 403 if user lacks ownership', async () => {
    // First query (user lookup) returns valid user;
    // ownership check returns no rows
    pool.query
      .mockResolvedValueOnce({ rows: [{ user_id: 1 }] })
      .mockResolvedValueOnce({ rows: [] });
    createErrorResponse.mockReturnValue({ error: 'Forbidden' });

    const res = await request(app)
      .put('/v1/baby/1/stool/10')
      .set('Authorization', `Bearer ${token}`)
      .send({ color: 'brown' });

    expect(res.status).toBe(403);
    expect(createErrorResponse).toHaveBeenCalledWith(403, 'Forbidden');
  });

  test('returns 404 if baby not found', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ user_id: 1 }] }) // user lookup
      .mockResolvedValueOnce({ rows: [{ user_id: 1, baby_id: 2 }] }) // ownership check for babyId 2
      .mockResolvedValueOnce({ rows: [] }); // baby existence fails
    createErrorResponse.mockReturnValue({ error: 'Baby not found' });

    const res = await request(app)
      .put('/v1/baby/2/stool/5')
      .set('Authorization', `Bearer ${token}`)
      .send({ color: 'brown' });

    expect(res.status).toBe(404);
    expect(createErrorResponse).toHaveBeenCalledWith(404, 'Baby not found');
  });

  test('returns 404 if stool entry not found', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ user_id: 1 }] }) // user lookup
      .mockResolvedValueOnce({ rows: [{ user_id: 1, baby_id: 1 }] }) // ownership check
      .mockResolvedValueOnce({ rows: [{ baby_id: 1 }] }) // baby exists
      .mockResolvedValueOnce({ rows: [] }); // stool entry not found
    createErrorResponse.mockReturnValue({ error: 'Stool entry not found' });

    const res = await request(app)
      .put('/v1/baby/1/stool/999')
      .set('Authorization', `Bearer ${token}`)
      .send({ color: 'brown' });

    expect(res.status).toBe(404);
    expect(createErrorResponse).toHaveBeenCalledWith(404, 'Stool entry not found');
  });

  test('returns 500 on DB error', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ user_id: 1 }] }) // user lookup
      .mockResolvedValueOnce({ rows: [{ user_id: 1, baby_id: 1 }] }) // ownership check
      .mockResolvedValueOnce({ rows: [{ baby_id: 1 }] }) // baby exists
      .mockResolvedValueOnce({ rows: [{ stool_id: 10, baby_id: 1 }] }); // stool entry exists
    pool.query.mockRejectedValueOnce(new Error('DB crash')); // update query fails
    createErrorResponse.mockReturnValue({ error: 'Internal server error' });

    const res = await request(app)
      .put('/v1/baby/1/stool/10')
      .set('Authorization', `Bearer ${token}`)
      .send({ color: 'brown' });

    expect(res.status).toBe(500);
    expect(createErrorResponse).toHaveBeenCalledWith(500, 'Internal server error');
  });
});

//
// Direct Invocation Tests – bypass Passport to trigger internal branches
//
describe('Direct Invocation Tests for updateStoolEntry', () => {
  let req, res;
  beforeEach(() => {
    req = {
      params: { babyId: "1", stoolId: "10" },
      headers: {},
      body: { color: "blue", consistency: "firm", notes: "updated note", timestamp: "2025-03-01T12:00:00Z" }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  // Covers missing authorization header.
  test('returns 401 if authorization header is missing', async () => {
    await updateStoolEntry(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(createErrorResponse).toHaveBeenCalledWith(401, "No authorization token provided");
  });

  // Covers missing token after "Bearer".
  test('returns 401 if token is missing after "Bearer"', async () => {
    req.headers.authorization = "Bearer ";
    await updateStoolEntry(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(createErrorResponse).toHaveBeenCalledWith(401, "Invalid token format");
  });

  // Covers jwt.decode returning null.
  test('returns 401 if jwt.decode returns null', async () => {
    req.headers.authorization = "Bearer sometoken";
    jest.spyOn(jwt, 'decode').mockReturnValue(null);
    await updateStoolEntry(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(createErrorResponse).toHaveBeenCalledWith(401, "Invalid token format");
  });

  // Covers decoded token missing the email property.
  test('returns 401 if decoded token lacks email property', async () => {
    req.headers.authorization = "Bearer sometoken";
    jest.spyOn(jwt, 'decode').mockReturnValue({ sub: "123" });
    await updateStoolEntry(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(createErrorResponse).toHaveBeenCalledWith(401, "Invalid token format");
  });

  // NEW TEST: Invalid stoolId format.
  test('returns 400 if stoolId is invalid format (direct invocation)', async () => {
    req.params.stoolId = "xyz"; // Invalid stoolId
    await updateStoolEntry(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(createErrorResponse).toHaveBeenCalledWith(400, "Invalid stoolId format");
  });

  // NEW TEST: User not found.
  test('returns 404 if user is not found (direct invocation)', async () => {
    req.headers.authorization = "Bearer validtoken";
    jest.spyOn(jwt, 'decode').mockReturnValue({ email: "test@example.com" });
    // Simulate user lookup returning no rows.
    pool.query.mockResolvedValueOnce({ rows: [] });
    await updateStoolEntry(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(createErrorResponse).toHaveBeenCalledWith(404, "User not found");
  });

  // Covers the successful update path.
  test('returns 200 on successful update (direct invocation)', async () => {
    req.headers.authorization = "Bearer validtoken";
    jest.spyOn(jwt, 'decode').mockReturnValue({ email: "test@example.com" });
    // Simulate queries in order:
    // 1: user lookup, 2: ownership check, 3: baby exists,
    // 4: stool entry exists, 5: update query.
    pool.query
      .mockResolvedValueOnce({ rows: [{ user_id: 1 }] }) // user lookup
      .mockResolvedValueOnce({ rows: [{ user_id: 1, baby_id: 1 }] }) // ownership check
      .mockResolvedValueOnce({ rows: [{ baby_id: 1 }] }) // baby exists
      .mockResolvedValueOnce({ rows: [{ stool_id: 10, baby_id: 1 }] }) // stool entry exists
      .mockResolvedValueOnce({
        rows: [{
          stool_id: 10,
          baby_id: 1,
          color: "blue",
          consistency: "firm",
          notes: "updated note",
          timestamp: "2025-03-01T12:00:00Z"
        }]
      }); // update query

    createSuccessResponse.mockReturnValue({
      stool_id: 10,
      baby_id: 1,
      color: "blue",
      consistency: "firm",
      notes: "updated note",
      timestamp: "2025-03-01T12:00:00Z"
    });
    await updateStoolEntry(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(createSuccessResponse).toHaveBeenCalledWith({
      stool_id: 10,
      baby_id: 1,
      color: "blue",
      consistency: "firm",
      notes: "updated note",
      timestamp: "2025-03-01T12:00:00Z"
    });
  });
});
