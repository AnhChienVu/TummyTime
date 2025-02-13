// src/routes/api/forum/posts/putPost.js
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
    const { post_id } = req.params;
    const { title, content } = req.body;

    // Validate request body
    if (!title || !content) {
      return createErrorResponse(res, 400, "Title and content are required");
    }

    // Validate authorization
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      logger.error("No authorization header found");
      return createErrorResponse(res, 401, "No authorization token provided");
    }

    // Decode the JWT token
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

    // Check if post exists and user is the author
    const checkPostQuery = `
      SELECT user_id 
      FROM forumpost 
      WHERE post_id = $1
    `;
    const postResult = await pool.query(checkPostQuery, [post_id]);

    if (postResult.rows.length === 0) {
      return createErrorResponse(res, 404, "Post not found");
    }

    if (postResult.rows[0].user_id !== userId) {
      return createErrorResponse(res, 403, "You can only edit your own posts");
    }

    // Update the post
    const updateQuery = `
      UPDATE forumpost 
      SET title = $1, 
          content = $2, 
          updated_at = CURRENT_TIMESTAMP 
      WHERE post_id = $3 
      RETURNING post_id, title, content, updated_at
    `;

    const result = await pool.query(updateQuery, [title, content, post_id]);

    return res.status(200).json({
      status: "ok",
      data: result.rows[0],
    });
  } catch (error) {
    logger.error(`Error updating post: ${error.message}`);
    return createErrorResponse(res, 500, error.message);
  }
};
