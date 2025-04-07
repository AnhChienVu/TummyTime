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

// Suppress console.log from DB connection
jest.spyOn(console, "log").mockImplementation(() => { }); 

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

  afterEach(() => {
    jest.clearAllMocks();
  });
  
  afterAll(() => {
    jest.restoreAllMocks();
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
    });// babyProfilesResult

    // 3. Growth check query returns count 0
    pool.query.mockResolvedValueOnce({ rows: [{ count: "0" }] }); // Growth check

    // 4. Milestones check query returns count 0
    pool.query.mockResolvedValueOnce({ rows: [{ count: "0" }] }); // Milestones check

    // 5. Feeding check query returns count 0
    pool.query.mockResolvedValueOnce({ rows: [{ count: "0" }] }); // Feeding check

    // 6. Stool check query returns count 0
    pool.query.mockResolvedValueOnce({ rows: [{ count: "0" }] }); // Stool check

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


    // 8. Mock pdf.create().toBuffer to simulate successful PDF conversion
    const fakeBuffer = Buffer.from("PDF CONTENT");
    pdf.create.mockReturnValue({
      toBuffer: (callback) => callback(null, fakeBuffer), 
    });

    await getExportPDF(req, res);

    // Verify PDF headers were set.
    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "application/pdf");
    expect(res.setHeader).toHaveBeenCalledWith(
      "Content-Disposition",
      expect.stringContaining("ExportedBabyData")
    );
    // Verify that pdf.create was called.
    expect(pdf.create).toHaveBeenCalled();
    // Verify buffer was sent.
    expect(res.send).toHaveBeenCalledWith(fakeBuffer);
  });

  test("should return 500 on database error", async () => {
    req.headers.authorization = "Bearer validtoken";
    getUserId.mockResolvedValue("1");
    // Simulate an error on the baby profiles query.
    pool.query.mockRejectedValue(new Error("DB error"));
    await getExportPDF(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(createErrorResponse).toHaveBeenCalledWith(500, "Internal server error");
  });


  // Test default date handling: when startDate is missing, it should fetch from user creation date.
  test("should set default startDate from user creation if not provided", async () => {
    req.headers.authorization = "Bearer validtoken";
    // No startDate in query.
    delete req.query.startDate;
    // Mock user creation date query:
    pool.query.mockResolvedValueOnce({ rows: [{ created_at: "2022-12-01" }] }); // for default startDate

    // Next, simulate that baby exists:
    pool.query.mockResolvedValueOnce({ rows: [{ count: "1" }] });
    // Then, query baby profiles returns one baby.
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
    // For sections, return empty arrays.
    pool.query.mockResolvedValueOnce({ rows: [] }); // Growth
    pool.query.mockResolvedValueOnce({ rows: [] }); // Milestones
    pool.query.mockResolvedValueOnce({ rows: [] }); // Feeding
    pool.query.mockResolvedValueOnce({ rows: [] }); // Stool
    // Insert export record returns a row.
    pool.query.mockResolvedValueOnce({
      rows: [
        {
          document_id: 1,
          file_name: "ExportedBabyData_Info_Growth_Milestones_Feeding_Stool_from2022-12-01_to" + new Date().toISOString().split("T")[0] + ".csv",
          file_format: "CSV",
          created_at: "2023-01-31",
        },
      ],
    });

    getUserId.mockResolvedValue("1");

    await getExportCSV(req, res);

    // Check that CSV headers were set
    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "text/csv");
    expect(res.send).toHaveBeenCalled(); 
    expect(res.send.mock.calls[0][0]).toMatch(/Baby Information/);
  });

  // Test that each section appears in CSV when data is present.
  test("should include sections with data if present", async () => {
    req.headers.authorization = "Bearer validtoken";
    req.query.startDate = "2023-01-01";
    req.query.endDate = "2023-01-31";
    getUserId.mockResolvedValue("1");

    // Baby profiles query returns one baby.
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
    // For growth records, return some data.
    pool.query.mockResolvedValueOnce({ rows: [{ growth_id: 101, date: "2023-01-15", weight: 3.5, height: 50, notes: "Good growth" }] });
    // For milestones, return some data.
    pool.query.mockResolvedValueOnce({ rows: [{ milestone_id: 201, date: "2023-01-10", title: "First Smile", details: "Smiled for the first time" }] });
    // For feeding schedule, return some data.
    pool.query.mockResolvedValueOnce({ rows: [{ feeding_schedule_id: 301, date: "2023-01-20", time: "08:00:00", meal: "Breakfast", amount: 100, type: "Formula", issues: "", notes: "" }] });
    // For stool records, return some data.
    pool.query.mockResolvedValueOnce({ rows: [{ stool_id: 401, timestamp: "2023-01-25T08:00:00Z", color: "Brown", consistency: "Seedy", notes: "" }] });
    // Insert export record returns a row.
    pool.query.mockResolvedValueOnce({
      rows: [
        {
          document_id: 1,
          file_name: expect.stringContaining("ExportedBabyData"),
          file_format: "CSV",
          created_at: "2023-01-31",
        },
      ],
    });

    await getExportCSV(req, res);

    const csvContent = res.send.mock.calls[0][0];
    // Check that CSV contains each section header.
    expect(csvContent).toMatch(/Baby Information/);
    expect(csvContent).toMatch(/Growth Records/);
    expect(csvContent).toMatch(/Milestones/);
    expect(csvContent).toMatch(/Feeding Schedule/);
    expect(csvContent).toMatch(/Stool Records/);
  });

  // Test proper error handling for database errors in any section.
  test("should return 500 on database error in section queries", async () => {
    req.headers.authorization = "Bearer validtoken";
    getUserId.mockResolvedValue("1");
    // Simulate error on baby profiles query.
    pool.query.mockRejectedValue(new Error("DB error"));
    await getExportCSV(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(createErrorResponse).toHaveBeenCalledWith(500, "Internal server error");
  }); 
});