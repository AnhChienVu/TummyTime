/* 
  src/routes/api/user/me.js

  Get the current user's details. The code here parses a JWT token from the Authorization header, decodes it, and uses the email to query the database for the user's details. The user's ID is then returned in the response.
 
  This endpoint is different from getUserById (getUser.js) in that it doesn't require an ID in the URL. Instead, it uses the JWT token to identify the user.
 */
const logger = require("../../../utils/logger");
const { createErrorResponse } = require("../../../utils/response");
const pool = require("../../../../database/db");
const jwt = require("jsonwebtoken");

module.exports.getUserDetails = async (req, res) => {
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      logger.error("No authorization header found");
      return createErrorResponse(res, 401, "No authorization token provided");
    }

    const token = authHeader.split(" ")[1]; // Remove 'Bearer ' prefix

    // Decode the JWT token
    const decoded = jwt.decode(token);

    if (!decoded || !decoded.email) {
      logger.error("No email found in token payload");
      return createErrorResponse(res, 401, "Invalid token format");
    }

    const email = decoded.email;
    logger.info(`Fetching user details for email: ${email}`);

    // Query to get user details from the database using email
    const query = `
      SELECT user_id
      FROM users
      WHERE email = $1
    `;

    const result = await pool.query(query, [email]);
    console.log("Database query result:", result);

    if (result.rows.length === 0) {
      logger.error(`User not found for email: ${email}`);
      return createErrorResponse(res, 404, "User not found");
    }

    const userId = result.rows[0].user_id;
    console.log(
      "***************************************************Found user ID:",
      userId
    );

    return res.status(200).json({
      status: "ok",
      id: userId,
    });
  } catch (error) {
    logger.error("Error fetching user details:", error);
    return createErrorResponse(res, 500, "Server error");
  }
};
