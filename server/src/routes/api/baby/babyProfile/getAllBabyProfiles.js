// src/routes/api/baby/babyProfile/getAllBabyProfiles.js
const pool = require("../../../../../database/db");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("../../../../utils/response");

module.exports = async (req, res) => {
  const { user_id } = req.params;

  // Validate user_id parameter
  if (!user_id || user_id === "undefined") {
    return res
      .status(400)
      .json(createErrorResponse("Missing user_id parameter"));
  }

  // Validate if user_id is a number
  if (isNaN(user_id)) {
    return res
      .status(400)
      .json(createErrorResponse("Invalid user_id parameter"));
  }

  try {
    const babyProfiles = await pool.query(
      `SELECT b.* FROM baby b
      JOIN user_baby ub ON b.baby_id = ub.baby_id
      JOIN users u ON u.user_id = ub.user_id
      WHERE u.user_id = $1
      ORDER BY b.baby_id ASC`,
      [parseInt(user_id, 10)] // Convert string to number
    );

    if (babyProfiles.rows.length === 0) {
      return res
        .status(404)
        .json(createErrorResponse("No baby profiles found for this user"));
    }

    return res.json(createSuccessResponse(babyProfiles.rows));
  } catch (error) {
    return res.status(500).json(createErrorResponse("Internal server error"));
  }
};
