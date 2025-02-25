const pool = require("../../../../../database/db");
const { createErrorResponse } = require("../../../../utils/response");
const logger = require("../../../../utils/logger");
const { getUserId } = require("../../../../utils/userIdHelper");

// GET /v1/forum/posts/:post_id
// Get a post and its replies
module.exports = async (req, res) => {
  try {
    const { post_id } = req.params;

    // Validate authorization
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      logger.error("No authorization header found");
      return createErrorResponse(res, 401, "No authorization token provided");
    }

    // Get user_id using the helper function
    const userId = await getUserId(authHeader);
    if (!userId) {
      return createErrorResponse(res, 404, "User not found");
    }

    // Query to get the specific post and its replies
    const postQuery = `
      SELECT 
        p.post_id,
        p.user_id,
        p.title,
        p.content,
        p.created_at,
        p.updated_at,
        COUNT(DISTINCT r.reply_id) as reply_count,
        COALESCE(
          json_agg(
            json_build_object(
              'reply_id', r.reply_id,
              'user_id', r.user_id,
              'content', r.content,
              'created_at', r.created_at,
              'updated_at', r.updated_at
            ) ORDER BY r.created_at ASC
          ) FILTER (WHERE r.reply_id IS NOT NULL),
          '[]'
        ) as replies
      FROM forumpost p
      LEFT JOIN forumreply r ON p.post_id = r.post_id
      LEFT JOIN users u ON p.user_id = u.user_id
      LEFT JOIN users ru ON r.user_id = ru.user_id
      WHERE p.post_id = $1
      GROUP BY p.post_id, p.user_id, p.title, p.content, p.created_at, p.updated_at
    `;

    const result = await pool.query(postQuery, [post_id]);

    if (result.rows.length === 0) {
      return createErrorResponse(res, 404, "Post not found");
    }

    return res.status(200).json({
      status: "ok",
      data: result.rows[0],
    });
  } catch (error) {
    logger.error(`Error fetching post: ${error.message}`);
    return createErrorResponse(res, 500, error.message);
  }
};
