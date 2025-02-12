// tests/unit/userIdHelper.test.js
const pool = require("../../database/db");
const logger = require("../../src/utils/logger");
const { getUserIdByEmail } = require("../../src/utils/userIdHelper");

jest.mock("../../database/db");
jest.mock("../../src/utils/logger");

describe("getUserIdByEmail", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should return user ID when valid email is provided", async () => {
    const mockEmail = "test@example.com";
    const mockUserId = 1;
    const mockQueryResult = {
      rows: [{ user_id: mockUserId }],
    };

    pool.query.mockResolvedValue(mockQueryResult);

    const result = await getUserIdByEmail(mockEmail);

    expect(result).toBe(mockUserId);
    expect(pool.query).toHaveBeenCalledWith(expect.any(String), [mockEmail]);
  });

  test("should return null when email does not exist", async () => {
    const mockEmail = "nonexistent@example.com";
    const mockQueryResult = {
      rows: [],
    };

    pool.query.mockResolvedValue(mockQueryResult);

    const result = await getUserIdByEmail(mockEmail);

    expect(result).toBeNull();
    expect(pool.query).toHaveBeenCalledWith(expect.any(String), [mockEmail]);
  });

  test("should throw error when database query fails", async () => {
    const mockEmail = "test@example.com";
    const mockError = new Error("Database connection error");

    pool.query.mockRejectedValue(mockError);

    await expect(getUserIdByEmail(mockEmail)).rejects.toThrow(
      "Database connection error"
    );
  });

  test("should log error when user is not found", async () => {
    const mockEmail = "notfound@example.com";
    const mockQueryResult = { rows: [] };

    pool.query.mockResolvedValue(mockQueryResult);
    logger.error = jest.fn();

    const result = await getUserIdByEmail(mockEmail);

    expect(result).toBeNull();
    expect(logger.error).toHaveBeenCalledWith(
      `User not found for email: ${mockEmail}`
    );
  });

  test("should safely handle emails with SQL injection attempts", async () => {
    const maliciousEmail = "'; DROP TABLE users; --";
    const mockQueryResult = { rows: [] };

    pool.query.mockResolvedValue(mockQueryResult);

    await getUserIdByEmail(maliciousEmail);

    expect(pool.query).toHaveBeenCalledWith(expect.any(String), [
      maliciousEmail,
    ]);
    const queryCall = pool.query.mock.calls[0];
    expect(queryCall[0]).not.toContain(maliciousEmail);
    expect(queryCall[1]).toContain(maliciousEmail);
  });
});
