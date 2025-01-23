// src/routes/api/getProfile.js
const pool = require("../../../database/db");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("../../utils/response");

module.exports = async (req, res) => {
  try {
    const profile = await pool.query("SELECT * FROM users");
    return res.json(createSuccessResponse(profile.rows[0]));
  } catch (error) {
    console.error("Database query error:", error);
    return res
      .status(500)
      .json(createErrorResponse(500, "Internal server error"));
  }
};
