// src/routes/api/forum/post/getAllForumReplies.js
const pool = require("../../../../../database/db");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("../../../../utils/response");
const jwt = require("jsonwebtoken");
const logger = require("../../../../utils/logger");
const { getUserIdByEmail } = require("../../../../utils/userIdHelper");

// GET /v1/forum/posts/:post_id/replies
// Get all replies for a post
module.exports = async (req, res) => {
  try {
    const { post_id } = req.params;

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
    const userId = await getUserIdByEmail(decoded.email);
    if (!userId) {
      return createErrorResponse(res, 404, "User not found");
    }

    // Verify post exists
    const postExists = await pool.query(
      "SELECT post_id FROM forumpost WHERE post_id = $1",
      [post_id]
    );

    if (postExists.rows.length === 0) {
      return createErrorResponse(res, 404, "Post not found");
    }

    // Get replies with user information
    const replies = await pool.query(
      `SELECT 
        r.reply_id,
        r.post_id,
        r.user_id,
        r.content,
        r.created_at,
        r.updated_at
      FROM forumreply r
      JOIN users u ON r.user_id = u.user_id
      WHERE r.post_id = $1
      ORDER BY r.created_at ASC`,
      [post_id]
    );

    return res.status(200).json({
      status: "ok",
      data: replies.rows,
    });
  } catch (error) {
    logger.error(`Error fetching replies: ${error.message}`);
    return createErrorResponse(res, 500, "Error fetching replies");
  }
};
