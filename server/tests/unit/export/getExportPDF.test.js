/**
 * File: tests/unit/export/[getExportPDF].test.js
 * Unit tests for GET /export/pdf
 */

const getExportPDF = require("../../../src/routes/api/export/getExportPDF");
const { createSuccessResponse, createErrorResponse } = require("../../../src/utils/response");
const pool = require("../../../database/db");
const { getUserId } = require("../../../src/utils/userIdHelper");
const pdf = require("html-pdf");

jest.mock("../../../database/db");
jest.mock("../../../src/utils/response");
jest.mock("../../../src/utils/userIdHelper");
jest.mock("html-pdf");

describe("getExportPDF endpoint", () => {
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
    await getExportPDF(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(createErrorResponse).toHaveBeenCalledWith(401, "No authorization token provided");
  });

  test("should return 401 if Invalid token", async () => {
    req.headers.authorization = "Bearer invalidtoken";
    getUserId.mockResolvedValue(null);
    await getExportPDF(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(createErrorResponse).toHaveBeenCalledWith(401, "Invalid user ID");
  });

  test("should return 404 if no baby found", async () => {
    req.headers.authorization = "Bearer validtoken";
    getUserId.mockResolvedValue("1");
    // First query: checkBabyExist returns count 0
    pool.query.mockResolvedValueOnce({ rows: [{ count: "0" }] });
    await getExportPDF(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(createErrorResponse).toHaveBeenCalledWith(404, "No baby profiles found for this user");
  });

  test("should generate PDF and insert export record", async () => {
    req.headers.authorization = "Bearer validtoken";
    getUserId.mockResolvedValue("1");

    // 1. checkBabyExist returns count > 0
    pool.query.mockResolvedValueOnce({ rows: [{ count: "1" }] });
    // 2. Query baby profiles returns one baby
    pool.query.mockResolvedValueOnce({
      rows: [
        {
          baby_id: 1,
          first_name: "Emma",
          last_name: "Smith",
          gender: "F",
          weight: 3.2,
          created_at: "2020-01-01T00:00:00Z",
        },
      ],
    });
    
    pool.query.mockResolvedValueOnce({ rows: [] }); // Growth
    pool.query.mockResolvedValueOnce({ rows: [] }); // Milestones
    pool.query.mockResolvedValueOnce({ rows: [] }); // Feeding
    pool.query.mockResolvedValueOnce({ rows: [] }); // Stool
    
    // Insert export record returns an inserted row
    pool.query.mockResolvedValueOnce({
      rows: [
        {
          document_id: 1,
          file_name: "ExportedBabyData_Info_Growth_Milestones_Feeding_Stool_from2023-01-01_to2023-01-31.pdf",
          file_format: "PDF",
          created_at: "2023-01-31",
        },
      ],
    });

    // Mock pdf.create().toBuffer to simulate successful PDF conversion
    const fakeBuffer = Buffer.from("PDF CONTENT");
    pdf.create.mockReturnValue({
      toBuffer: (callback) => callback(null, fakeBuffer),
    });

    await getExportPDF(req, res);

    // Verify PDF headers were set
    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "application/pdf");
    expect(res.setHeader).toHaveBeenCalledWith(
      "Content-Disposition",
      expect.stringContaining("ExportedBabyData")
    );
    // Verify that pdf.create was called
    expect(pdf.create).toHaveBeenCalled();
    // Verify buffer was sent
    expect(res.send).toHaveBeenCalledWith(fakeBuffer);
  });

  test("should return 500 on database error", async () => {
    req.headers.authorization = "Bearer validtoken";
    getUserId.mockResolvedValue("1");
    // Simulate an error on the baby profiles query
    pool.query.mockRejectedValue(new Error("DB error"));
    await getExportPDF(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(createErrorResponse).toHaveBeenCalledWith(500, "Internal server error");
  });
});
