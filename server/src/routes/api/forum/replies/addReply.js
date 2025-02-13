// src/routes/api/forum/replies/addForumReply.js
const pool = require("../../../../../database/db");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("../../../../utils/response");
const jwt = require("jsonwebtoken");
const logger = require("../../../../utils/logger");
const { getUserIdByEmail } = require("../../../../utils/userIdHelper");

module.exports = async (req, res) => {
  try {
    const content = req.body.content;
    const post_id = req.params.post_id;

    // Validate authorization
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      logger.error("No authorization header found");
      return createErrorResponse(res, 401, "No authorization token provided");
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.decode(token);

    if (!decoded || !decoded.email) {
      logger.error("No email found in token payload");
      return createErrorResponse(res, 401, "Invalid token format");
    }

    // Get user_id using the helper function
    const user_id = await getUserIdByEmail(decoded.email);
    if (!user_id) {
      return createErrorResponse(res, 404, "User not found");
    }

    // Verify the post exists
    const postExists = await pool.query(
      "SELECT post_id FROM forumpost WHERE post_id = $1",
      [post_id]
    );

    if (!postExists.rows.length) {
      return createErrorResponse(res, 404, "Post not found");
    }

    const result = await pool.query(
      "INSERT INTO forumreply (user_id, post_id, content) VALUES ($1, $2, $3) RETURNING *",
      [user_id, post_id, content]
    );

    return res.status(200).json({
      status: "ok",
      data: result.rows[0],
    });
  } catch (error) {
    logger.error(`Error creating reply: ${error.message}`);
    return createErrorResponse(res, 500, "Error creating reply");
  }
};
