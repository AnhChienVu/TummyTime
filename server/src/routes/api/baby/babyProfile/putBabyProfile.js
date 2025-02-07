// src/routes/api/baby/babyProfile/putBabyProfile.js
const pool = require("../../../../../database/db");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("../../../../utils/response");

module.exports = async (req, res) => {
  const user_id = req.body.user_id;
  const { baby_id } = req.params;
  const { first_name, last_name, gender, weight } = req.body.data;

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
        .json(createErrorResponse("Not authorized to edit this baby profile"));
    }

    // Update baby information
    const result = await pool.query(
      "UPDATE baby SET first_name = $1, last_name = $2, gender = $3, weight = $4 WHERE baby_id = $5 RETURNING *",
      [first_name, last_name, gender, weight, baby_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json(createErrorResponse("Baby not found"));
    }

    res.json(createSuccessResponse("Baby profile updated successfully"));
  } catch (error) {
    console.error("Error updating baby:", error);
    res
      .status(500)
      .json(createErrorResponse("Error updating baby information"));
  }
};
