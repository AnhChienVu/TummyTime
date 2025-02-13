// src/routes/api/baby/babyProfile/getBabyProfile.js
const pool = require("../../../../../database/db");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("../../../../utils/response");

module.exports = async (req, res) => {
  const { baby_id } = req.params;

  // Validate baby_id parameter
  if (!baby_id || baby_id === "undefined") {
    return res
      .status(400)
      .json(createErrorResponse("Missing baby_id parameter"));
  }

  // Validate if baby_id is a number
  if (isNaN(baby_id)) {
    return res
      .status(400)
      .json(createErrorResponse("Invalid baby_id parameter"));
  }

  try {
    const babyProfile = await pool.query(
      "SELECT * FROM baby WHERE baby_id = $1",
      [baby_id]
    );

    if (babyProfile.rows.length === 0) {
      return res
        .status(404)
        .json(createErrorResponse("Baby profile not found"));
    }

    return res.json(createSuccessResponse(babyProfile.rows[0]));
  } catch (error) {
    return res.status(500).json(createErrorResponse("Internal server error"));
  }
};
