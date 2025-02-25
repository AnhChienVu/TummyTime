// src/routes/api/user/getUser.js
// GET /user routes

const {
  createSuccessResponse,
  createErrorResponse,
} = require("../../../utils/response");
const pool = require("../../../../database/db");
const { getUserId } = require("../../../utils/userIdHelper");

/**
 * route: GET /user/:id
 * GET an existing user
 */
module.exports.getUserById = async (req, res) => {
  try {
    // Decode the token to get the user ID
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      logger.error("No authorization header found");
      return res
        .status(401)
        .json(createErrorResponse(401, "No authorization token provided"));
    }

    const userId = await getUserId(authHeader);
    if (!userId) {
      return createErrorResponse(res, 404, "User not found");
    }

    // Get the user's profile from the database
    const profile = await pool.query("SELECT * FROM users WHERE user_id = $1", [
      userId,
    ]);
    return res.json(createSuccessResponse(profile.rows[0]));
  } catch (error) {
    console.error("Database query error:", error);
    return res
      .status(500)
      .json(createErrorResponse(500, "Internal server error"));
  }
};
