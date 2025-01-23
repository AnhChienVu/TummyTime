// src/routes/api/getBabyProfiles.js
const pool = require("../../../database/db");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("../../utils/response");

module.exports = async (req, res) => {
  try {
    const babyProfiles = await pool.query("SELECT * FROM baby");
    console.log("babyProfiles: ", babyProfiles);
    return res.json(createSuccessResponse(babyProfiles.rows));
  } catch (error) {
    console.error("Database query error:", error);
    return res
      .status(500)
      .json(createErrorResponse(500, "Internal server error"));
  }
};
