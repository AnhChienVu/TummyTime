// tests/unit/addBaby.test.js
const request = require("supertest");
const express = require("express");
const pool = require("../../database/db");
const app = require("../../src/app");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("../../src/utils/response");

jest.mock("../../database/db");
jest.mock("../../src/utils/response");

describe("POST /v1/addBaby", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should return 200 and add a new baby", async () => {
    const newBaby = {
      first_name: "John",
      last_name: "Doe",
      gender: "boy",
      weight: "10",
    };

    pool.query.mockResolvedValueOnce({
      rows: [newBaby],
    });

    const res = await request(app).post("/v1/addBaby").send(newBaby);

    expect(res.status).toBe(200);
    expect(createSuccessResponse).toHaveBeenCalledWith(newBaby);
  });

  test("should return 500 if there is a database error", async () => {
    const newBaby = {
      first_name: "Jane",
      last_name: "Doe",
      gender: "girl",
      weight: "15",
    };

    pool.query.mockRejectedValueOnce(new Error("Database error"));

    const res = await request(app).post("/v1/addBaby").send(newBaby);

    expect(res.status).toBe(500);
    expect(createErrorResponse).toHaveBeenCalledWith(
      500,
      "Internal server error"
    );
  });
});
