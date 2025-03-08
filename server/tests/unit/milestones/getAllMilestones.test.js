// tests/unit/milestones/getAllMilestones.test.js
const getAllMilestones = require("../../../src/routes/api/milestones/getAllMilestones");
const pool = require("../../../database/db");
const { getUserId } = require("../../../src/utils/userIdHelper");
const logger = require("../../../src/utils/logger");

jest.mock("../../../src/utils/userIdHelper");
jest.mock("../../../database/db");
jest.mock("../../../src/utils/logger");

describe("GET /v1/milestones", () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      headers: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  test("should return milestones successfully with formatted names", async () => {
    mockReq.headers.authorization = "Bearer token";
    const mockUserId = "123";
    const mockMilestones = [
      {
        id: 1,
        baby_id: 1,
        title: "First steps",
        first_name: "John",
        last_name: "Doe",
      },
      {
        id: 2,
        baby_id: 1,
        title: "First words",
        first_name: null,
        last_name: null,
      },
    ];

    getUserId.mockResolvedValue(mockUserId);
    pool.query.mockResolvedValue({ rows: mockMilestones });

    await getAllMilestones(mockReq, mockRes);

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("SELECT m.*, b.first_name, b.last_name"),
      [mockUserId]
    );

    expect(mockRes.json).toHaveBeenCalledWith({
      status: "ok",
      data: [
        {
          id: 1,
          baby_id: 1,
          title: "First steps",
          first_name: "John",
          last_name: "Doe",
        },
        {
          id: 2,
          baby_id: 1,
          title: "First words",
          first_name: "Unknown",
          last_name: "",
        },
      ],
    });
  });

  test("should handle database errors", async () => {
    mockReq.headers.authorization = "Bearer token";
    const mockUserId = "123";

    getUserId.mockResolvedValue(mockUserId);
    pool.query.mockRejectedValue(new Error("Database error"));

    await getAllMilestones(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: "error",
      error: {
        code: 500,
        message: "Internal server error",
      },
    });
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining("Error getting milestones")
    );
  });

  test("should return empty array when no milestones exist", async () => {
    mockReq.headers.authorization = "Bearer token";
    const mockUserId = "123";

    getUserId.mockResolvedValue(mockUserId);
    pool.query.mockResolvedValue({ rows: [] });

    await getAllMilestones(mockReq, mockRes);

    expect(mockRes.json).toHaveBeenCalledWith({
      status: "ok",
      data: [],
    });
  });

  test("should return 401 when no authorization header is provided", async () => {
    // Don't set authorization header
    await getAllMilestones(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: "error",
      error: {
        code: 401,
        message: "No authorization token provided",
      },
    });
  });

  test("should return 404 when user is not found", async () => {
    mockReq.headers.authorization = "Bearer invalid-token";

    // Mock getUserId to return null to simulate user not found
    getUserId.mockResolvedValue(null);

    await getAllMilestones(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: "error",
      error: {
        code: 404,
        message: "User not found",
      },
    });
    expect(pool.query).not.toHaveBeenCalled();
  });
});
