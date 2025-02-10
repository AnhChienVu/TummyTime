// src/routes/api/forum/posts/getPosts.js
const pool = require("../../../../../database/db");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("../../../../utils/response");

module.exports = async (req, res) => {
  try {
    const posts = await pool.query(
      `SELECT p.*, u.username, 
            (SELECT COUNT(*) FROM forumreply WHERE post_id = p.post_id) as reply_count 
            FROM forum_posts p 
            JOIN users u ON p.user_id = u.user_id 
            ORDER BY p.created_at DESC`
    );

    res.json(createSuccessResponse("Posts retrieved successfully", posts.rows));
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json(createErrorResponse("Error fetching posts"));
  }
};
