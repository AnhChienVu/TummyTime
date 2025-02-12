// src/routes/api/baby/babyProfile/putBabyProfile.js
const pool = require("../../../../../database/db");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("../../../../utils/response");

module.exports = async (req, res) => {
  const user_id = req.body.user_id;
  const { baby_id } = req.params;

  // Check if data object exists
  if (!req.body.data) {
    return res
      .status(400)
      .json(createErrorResponse("Missing required parameters: data object"));
  }

  const { first_name, last_name, gender, weight } = req.body.data;

  // Validate all required fields
  const requiredFields = { first_name, last_name, gender, weight };
  const missingFields = Object.entries(requiredFields)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingFields.length > 0) {
    return res
      .status(400)
      .json(
        createErrorResponse(
          `Missing required parameters: ${missingFields.join(", ")}`
        )
      );
  }

  try {
    // Validate user and baby IDs
    if (!user_id || !baby_id) {
      return res
        .status(400)
        .json(createErrorResponse("Missing required parameters"));
    }

    // Verify user has access to this baby
    const userBaby = await pool.query(
      "SELECT * FROM user_baby WHERE user_id = $1 AND baby_id = $2",
      [user_id, baby_id]
    );

    if (!userBaby.rows.length) {
      return res
        .status(403)
        .json(
          createErrorResponse("Not authorized to update this baby profile")
        );
    }

    // Update baby information
    const result = await pool.query(
      "UPDATE baby SET first_name = $1, last_name = $2, gender = $3, weight = $4 WHERE baby_id = $5 RETURNING *",
      [first_name, last_name, gender, weight, baby_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json(createErrorResponse("Baby not found"));
    }

    return res.json(createSuccessResponse(result.rows[0]));
  } catch (error) {
    return res
      .status(500)
      .json(
        createErrorResponse("Internal server error while updating baby profile")
      );
  }
};
