// tests/unit/forum/putReply.test.js
const putReply = require("../../../src/routes/api/forum/replies/putReply");
const pool = require("../../../database/db");
const jwt = require("jsonwebtoken");
const logger = require("../../../src/utils/logger");
const { getUserIdByEmail } = require("../../../src/utils/userIdHelper");
const { createErrorResponse } = require("../../../src/utils/response");

jest.mock("../../../database/db");
jest.mock("jsonwebtoken");
jest.mock("../../../src/utils/logger");
jest.mock("../../../src/utils/userIdHelper");
jest.mock("../../../src/utils/response");

describe("PUT V1/forum/replies/:reply_id", () => {
  let req;
  let res;
  const mockUserId = 1;

  beforeEach(() => {
    req = {
      params: { reply_id: 1 },
      body: { content: "Updated reply content" },
      headers: { authorization: "Bearer mock-token" },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest.clearAllMocks();

    // Mock JWT decode instead of verify
    jwt.decode.mockReturnValue({ email: "test@example.com" });
    getUserIdByEmail.mockResolvedValue(mockUserId);

    // Mock successful DB responses
    pool.query.mockImplementation((query) => {
      if (query === "BEGIN") {
        return Promise.resolve();
      } else if (query === "COMMIT") {
        return Promise.resolve();
      } else if (query.includes("SELECT r.user_id")) {
        return Promise.resolve({
          rows: [{ user_id: mockUserId, post_id: 1 }],
          rowCount: 1,
        });
      } else if (query.includes("UPDATE forumreply")) {
        return Promise.resolve({
          rows: [
            {
              reply_id: 1,
              post_id: 1,
              user_id: mockUserId,
              content: "Updated reply content",
              created_at: new Date(),
              updated_at: new Date(),
            },
          ],
        });
      }
    });
  });

  test("should successfully update a reply", async () => {
    await putReply(req, res);

    expect(pool.query).toHaveBeenCalledWith("BEGIN");
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE forumreply"),
      ["Updated reply content", 1]
    );
    expect(pool.query).toHaveBeenCalledWith("COMMIT");
    expect(res.json).toHaveBeenCalledWith({
      status: "success",
      message: "Reply updated successfully",
      data: expect.objectContaining({
        reply_id: expect.any(Number),
        content: "Updated reply content",
      }),
    });
  });

  test("should return 400 if content is missing", async () => {
    req.body.content = undefined;
    await putReply(req, res);

    expect(createErrorResponse).toHaveBeenCalledWith(
      res,
      400,
      "Title and content are required"
    );
  });

  test("should return 401 if no authorization header", async () => {
    req.headers.authorization = undefined;
    await putReply(req, res);

    expect(createErrorResponse).toHaveBeenCalledWith(
      res,
      401,
      "No authorization token provided"
    );
  });

  test("should return 401 if token is invalid", async () => {
    jwt.decode.mockReturnValue(null);
    await putReply(req, res);

    expect(createErrorResponse).toHaveBeenCalledWith(
      res,
      401,
      "Invalid token format"
    );
  });

  test("should return 404 if user not found", async () => {
    getUserIdByEmail.mockResolvedValue(null);
    await putReply(req, res);

    expect(createErrorResponse).toHaveBeenCalledWith(
      res,
      404,
      "User not found"
    );
  });

  test("should return 404 if reply not found", async () => {
    pool.query.mockImplementation((query) => {
      if (query === "BEGIN") return Promise.resolve();
      if (query.includes("SELECT")) {
        return Promise.resolve({ rows: [] });
      }
    });

    await putReply(req, res);

    expect(pool.query).toHaveBeenCalledWith("ROLLBACK");
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      status: "error",
      message: "Reply not found",
    });
  });

  test("should return 403 if user is not reply author", async () => {
    pool.query.mockImplementation((query) => {
      if (query === "BEGIN") return Promise.resolve();
      if (query.includes("SELECT")) {
        return Promise.resolve({
          rows: [{ user_id: 999, post_id: 1 }], // Different user_id
        });
      }
    });

    await putReply(req, res);

    expect(pool.query).toHaveBeenCalledWith("ROLLBACK");
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      status: "error",
      message: "You can only edit your own replies",
    });
  });

  test("should handle database errors", async () => {
    pool.query.mockRejectedValue(new Error("Database error"));
    await putReply(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      status: "error",
      message: "Internal server error",
    });
  });
});
