// tests/unit/journal/putJournalEntry.test.js
const putJournalEntry = require("../../../src/routes/api/journal/putJournalEntry");
const pool = require("../../../database/db");
const jwt = require("jsonwebtoken");
const { getUserIdByEmail } = require("../../../src/utils/userIdHelper");

jest.mock("../../../database/db");
jest.mock("jsonwebtoken");
jest.mock("../../../src/utils/logger");
jest.mock("../../../src/utils/userIdHelper");
jest.mock("../../../src/utils/response");

describe("PUT /v1/journal/:entry_id", () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    mockReq = {
      params: { entry_id: "1" },
      body: { title: "Test Title", content: "Test Content" },
      headers: { authorization: "Bearer validtoken" },
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Reset all mocks
    jest.clearAllMocks();
  });

  test("should return 400 for invalid entry_id", async () => {
    mockReq.params.entry_id = "invalid";
    await putJournalEntry(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Invalid entry ID provided",
      })
    );
  });

  test("should return 400 for missing title or content", async () => {
    mockReq.body = { title: "" };
    await putJournalEntry(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Title and content are required",
      })
    );
  });

  test("should return 401 for missing authorization header", async () => {
    mockReq.headers = {};
    await putJournalEntry(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "No authorization token provided",
      })
    );
  });

  test("should return 401 for invalid token format", async () => {
    jwt.decode = jest.fn().mockReturnValue(null);
    await putJournalEntry(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Invalid token format",
      })
    );
  });

  test("should return 404 when user not found", async () => {
    jwt.decode = jest.fn().mockReturnValue({ email: "test@example.com" });
    getUserIdByEmail.mockResolvedValue(null);
    await putJournalEntry(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "User not found",
      })
    );
  });

  test("should return 404 when journal entry not found", async () => {
    jwt.decode = jest.fn().mockReturnValue({ email: "test@example.com" });
    getUserIdByEmail.mockResolvedValue(1);
    pool.query.mockResolvedValueOnce({ rows: [] });

    await putJournalEntry(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Journal entry not found",
      })
    );
  });

  test("should return 403 when user is not the author", async () => {
    jwt.decode = jest.fn().mockReturnValue({ email: "test@example.com" });
    getUserIdByEmail.mockResolvedValue(1);
    pool.query.mockResolvedValueOnce({
      rows: [{ user_id: 2 }],
    });

    await putJournalEntry(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "You can only edit your own journal entries",
      })
    );
  });

  test("should successfully update journal entry", async () => {
    jwt.decode = jest.fn().mockReturnValue({ email: "test@example.com" });
    getUserIdByEmail.mockResolvedValue(1);
    pool.query
      .mockResolvedValueOnce({ rows: [{ user_id: 1 }] })
      .mockResolvedValueOnce({
        rows: [
          {
            entry_id: 1,
            title: "Updated Title",
            content: "Updated Content",
            updated_at: new Date(),
          },
        ],
      });

    await putJournalEntry(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "ok",
        data: expect.any(Object),
      })
    );
  });

  test("should handle database errors", async () => {
    jwt.decode = jest.fn().mockReturnValue({ email: "test@example.com" });
    getUserIdByEmail.mockResolvedValue(1);
    pool.query.mockRejectedValue(new Error("Database error"));

    await putJournalEntry(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Database error",
      })
    );
  });
});
