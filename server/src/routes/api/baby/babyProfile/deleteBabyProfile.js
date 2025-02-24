// src/routes/api/baby/babyProfile/deleteBabyProfile.js
const pool = require("../../../../../database/db");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("../../../../utils/response");
const { checkBabyAccess } = require("../../../../utils/babyAccessHelper");

module.exports = async (req, res) => {
  const user_id = req.body.user_id;
  const { baby_id } = req.params;

  try {
    // Validate user and baby IDs
    if (!user_id || !baby_id) {
      return res
        .status(400)
        .json(createErrorResponse("Missing required parameters"));
    }

    // Verify user has access to this baby using the helper function
    const hasAccess = await checkBabyAccess(user_id, baby_id);
    if (!hasAccess) {
      return res
        .status(403)
        .json(
          createErrorResponse("Not authorized to delete this baby profile")
        );
    }

    // Delete the entry from the user_baby bridge table
    await pool.query(
      "DELETE FROM user_baby WHERE user_id = $1 AND baby_id = $2",
      [user_id, baby_id]
    );

    // Delete the baby profile
    const result = await pool.query("DELETE FROM baby WHERE baby_id = $1", [
      baby_id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json(createErrorResponse("Baby not found"));
    }

    res.json(createSuccessResponse("Baby profile deleted successfully"));
  } catch (error) {
    return res.status(500).json(createErrorResponse("Internal server error"));
  }
};
