// src/routes/api/baby/babyProfile/getBabyProfile.js
const pool = require("../../../../../database/db");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("../../../../utils/response");

module.exports = async (req, res) => {
  const { baby_id } = req.params;

  try {
    const babyProfile = await pool.query(
      "SELECT * FROM baby WHERE baby_id = $1",
      [baby_id]
    );
    return res.json(createSuccessResponse(babyProfile.rows[0]));
  } catch (error) {
    console.error("Database query error:", error);
    return res
      .status(500)
      .json(createErrorResponse(500, "Internal server error"));
  }
};
