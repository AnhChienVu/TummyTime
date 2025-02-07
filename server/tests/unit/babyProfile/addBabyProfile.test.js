// tests/unit/babyProfile/addBabyProfile.test.js
const request = require("supertest");
const express = require("express");
const passport = require("passport");
const pool = require("../../../database/db");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("../../../src/utils/response");
const { strategy, authenticate } = require("../../../src/auth/jwt-middleware");
const { generateToken } = require("../../../src/utils/jwt");

// app properly handles the route
const addBaby = require("../../src/routes/api/addBaby");
const app = express();
app.use(express.json());
app.use(passport.initialize());
passport.use(strategy());
app.post("/v1/user/:user_id/addBaby", authenticate(), addBaby);

jest.mock("../../database/db");
jest.mock("../../src/utils/response");

describe("POST v1/user/:user_id/addBaby", () => {
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

    const user = {
      userId: 1,
      firstName: "Anh",
      lastName: "Vu",
      email: "user1@email.com",
      role: "Parent",
    };
    const token = generateToken(user);

    const res = await request(app)
      .post("/v1/user/1/addBaby")
      .set("Authorization", `Bearer ${token}`) // Include the token in the Authorization header
      .send(newBaby);

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

    const user = {
      userId: 1,
      firstName: "Anh",
      lastName: "Vu",
      email: "user1@email.com",
      role: "Parent",
    };
    const token = generateToken(user);

    const res = await request(app)
      .post("/v1/user/1/addBaby")
      .set("Authorization", `Bearer ${token}`) // Include the token in the Authorization header
      .send(newBaby);

    expect(res.status).toBe(500);
    expect(createErrorResponse).toHaveBeenCalledWith(
      500,
      "Internal server error"
    );
  });
});
