/**
 * File: tests/unit/export/getExportCSV.test.js
 * Unit tests for GET /export/csv
 */

const getExportCSV = require("../../../src/routes/api/export/getExportCSV");
const { createSuccessResponse, createErrorResponse } = require("../../../src/utils/response");
const pool = require("../../../database/db");
const { getUserId } = require("../../../src/utils/userIdHelper");

// Mock dependencies
jest.mock("../../../database/db");
jest.mock("../../../src/utils/response");
jest.mock("../../../src/utils/userIdHelper");

describe("getExportCSV endpoint", () => {
  let req, res;

  beforeEach(() => {
    req = {
      headers: {},
      query: {
        startDate: "2023-01-01",
        endDate: "2023-01-31",
        babyInfo: "true",
        growthRecords: "true",
        milestones: "true",
        feedingSchedule: "true",
        stoolRecords: "true",
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn(),
      send: jest.fn(),
    };
    jest.clearAllMocks();
  });

  test("should return 401 if no authorization header provided", async () => {
    await getExportCSV(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(createErrorResponse).toHaveBeenCalledWith(401, "No authorization token provided");
  });

  test("should return 401 if Invalid token", async () => {
    req.headers.authorization = "Bearer invalidtoken";
    getUserId.mockResolvedValue(null);
    await getExportCSV(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(createErrorResponse).toHaveBeenCalledWith(401, "Invalid user ID");
  });

  test("should return 404 if no baby found", async () => {
    req.headers.authorization = "Bearer validtoken";
    getUserId.mockResolvedValue("1");
    // First pool.query call for baby profiles returns empty array.
    pool.query.mockResolvedValueOnce({ rows: [{ count: "0" }] });

    await getExportCSV(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(createErrorResponse).toHaveBeenCalledWith(404, "No baby profiles found for this user");
  });

  test("should generate CSV and insert export record", async () => {
    req.headers.authorization = "Bearer validtoken";
    getUserId.mockResolvedValue("1");

    // 1. Baby profiles query returns one baby.
    pool.query.mockResolvedValueOnce({
      rows: [
        {
          baby_id: 1,
          first_name: "Emma",
          last_name: "Smith",
          birthdate: "2020-01-01",
          gender: "F",
          weight: 3.2,
          created_at: "2020-01-01T00:00:00Z",
        },
      ],
    });
    // 2. Growth records query returns empty.
    pool.query.mockResolvedValueOnce({ rows: [] });
    // 3. Milestones query returns empty.
    pool.query.mockResolvedValueOnce({ rows: [] });
    // 4. Feeding schedule query returns empty.
    pool.query.mockResolvedValueOnce({ rows: [] });
    // 5. Stool records query returns empty.
    pool.query.mockResolvedValueOnce({ rows: [] });
    // 6. Insert export record returns the inserted row.
    pool.query.mockResolvedValueOnce({
      rows: [
        {
          document_id: 1,
          file_name: "ExportedBabyData_Info_Growth_Milestones_Feeding_Stool_from2023-01-01_to2023-01-31.csv",
          file_format: "CSV",
          created_at: "2023-01-31",
        },
      ],
    });

    await getExportCSV(req, res);

    // Check that CSV headers were set.
    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "text/csv");
    expect(res.setHeader).toHaveBeenCalledWith(
      "Content-Disposition",
      expect.stringContaining("ExportedBabyData")
    );
    // Verify CSV content was sent.
    expect(res.send).toHaveBeenCalled();
  });

  test("should return 500 on database error", async () => {
    req.headers.authorization = "Bearer validtoken";
    getUserId.mockResolvedValue("1");
    // Simulate an error on the baby profiles query.
    pool.query.mockRejectedValue(new Error("DB error"));
    await getExportCSV(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(createErrorResponse).toHaveBeenCalledWith(500, "Internal server error");
  });
});
