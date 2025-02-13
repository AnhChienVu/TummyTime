// src/routes/api/forum/post/getAllForumReplies.js
const pool = require("../../../../../database/db");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("../../../../utils/response");

module.exports = async (req, res) => {
  const { post_id } = req.params;

  try {
    const replies = await pool.query(
      `SELECT r.*, u.username 
            FROM forum_replies r
            JOIN users u ON r.user_id = u.user_id
            WHERE r.post_id = $1
            ORDER BY r.created_at ASC`,
      [post_id]
    );

    res.json(
      createSuccessResponse("Replies retrieved successfully", replies.rows)
    );
  } catch (error) {
    console.error("Error fetching replies:", error);
    res.status(500).json(createErrorResponse("Error fetching replies"));
  }
};
