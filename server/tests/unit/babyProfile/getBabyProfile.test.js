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

const getBabyProfile = require("../../src/routes/api/baby/babyProfile/getBabyProfile");
const app = express();
app.use(express.json());
app.use(passport.initialize());
passport.use(strategy());
app.get("/v1/baby/:baby_id/getBabyProfile", authenticate(), getBabyProfile);

jest.mock("../../../database/db");
jest.mock("../../../src/utils/response");

describe("GET v1/baby/:baby_id/getBabyProfile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should return 200 and baby profile details", async () => {
    const babyProfile = {
      baby_id: 1,
      first_name: "John",
      last_name: "Doe",
      gender: "boy",
      weight: "10",
    };

    pool.query.mockResolvedValueOnce({
      rows: [babyProfile],
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
      .get("/v1/baby/1/getBabyProfile")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(createSuccessResponse).toHaveBeenCalledWith(babyProfile);
  });

  test("should return 404 when baby profile not found", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [],
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
      .get("/v1/baby/999/getBabyProfile")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(createErrorResponse).toHaveBeenCalledWith("Baby profile not found");
  });

  test("should return 500 if there is a database error", async () => {
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
      .get("/v1/baby/1/getBabyProfile")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(500);
    expect(createErrorResponse).toHaveBeenCalledWith(
      "Internal server error while fetching baby profile"
    );
  });

  test("should return 400 when baby_id param is missing", async () => {
    const user = {
      userId: 1,
      firstName: "Anh",
      lastName: "Vu",
      email: "user1@email.com",
      role: "Parent",
    };
    const token = generateToken(user);

    const res = await request(app)
      .get("/v1/baby//getBabyProfile")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(createErrorResponse).toHaveBeenCalledWith(
      "Missing baby_id parameter"
    );
  });
});
