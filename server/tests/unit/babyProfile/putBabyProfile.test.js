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

const updateBabyProfile = require("../../src/routes/api/baby/babyProfile/putBabyProfile");
const app = express();
app.use(express.json());
app.use(passport.initialize());
passport.use(strategy());
app.put(
  "/v1/baby/:baby_id/updateBabyProfile",
  authenticate(),
  updateBabyProfile
);

jest.mock("../../../database/db");
jest.mock("../../../src/utils/response");

describe("PUT v1/baby/:baby_id/updateBabyProfile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should return 200 and update baby profile", async () => {
    const updatedBaby = {
      first_name: "John",
      last_name: "Doe",
      gender: "boy",
      weight: "12",
    };

    pool.query
      .mockResolvedValueOnce({ rows: [{ user_id: 1, baby_id: 1 }] }) // Auth check
      .mockResolvedValueOnce({ rows: [updatedBaby] }); // Update query

    const user = {
      userId: 1,
      firstName: "Anh",
      lastName: "Vu",
      email: "user1@email.com",
      role: "Parent",
    };
    const token = generateToken(user);

    const res = await request(app)
      .put("/v1/baby/1/updateBabyProfile")
      .set("Authorization", `Bearer ${token}`)
      .send({ user_id: 1, ...updatedBaby });

    expect(res.status).toBe(200);
    expect(createSuccessResponse).toHaveBeenCalledWith(updatedBaby);
  });

  test("should return 403 when user is not authorized", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] }); // No auth record found

    const user = {
      userId: 2,
      firstName: "Test",
      lastName: "User",
      email: "user2@email.com",
      role: "Parent",
    };
    const token = generateToken(user);

    const res = await request(app)
      .put("/v1/baby/1/updateBabyProfile")
      .set("Authorization", `Bearer ${token}`)
      .send({
        user_id: 2,
        first_name: "John",
        last_name: "Doe",
      });

    expect(res.status).toBe(403);
    expect(createErrorResponse).toHaveBeenCalledWith(
      "Not authorized to update this baby profile"
    );
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
      .put("/v1/baby/1/updateBabyProfile")
      .set("Authorization", `Bearer ${token}`)
      .send({
        user_id: 1,
        first_name: "John",
        last_name: "Doe",
      });

    expect(res.status).toBe(500);
    expect(createErrorResponse).toHaveBeenCalledWith(
      "Internal server error while updating baby profile"
    );
  });

  test("should return 400 when required parameters are missing", async () => {
    const user = {
      userId: 1,
      firstName: "Anh",
      lastName: "Vu",
      email: "user1@email.com",
      role: "Parent",
    };
    const token = generateToken(user);

    const res = await request(app)
      .put("/v1/baby/1/updateBabyProfile")
      .set("Authorization", `Bearer ${token}`)
      .send({}); // Missing required fields

    expect(res.status).toBe(400);
    expect(createErrorResponse).toHaveBeenCalledWith(
      "Missing required parameters"
    );
  });
});
