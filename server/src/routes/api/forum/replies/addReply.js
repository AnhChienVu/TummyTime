// src/routes/api/forum/replies/addForumReply.js
const pool = require("../../../../../database/db");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("../../../../utils/response");

module.exports = async (req, res) => {
  const { user_id, post_id, content } = req.body;

  try {
    // Verify the post exists
    const postExists = await pool.query(
      "SELECT post_id FROM forum_posts WHERE post_id = $1",
      [post_id]
    );

    if (!postExists.rows.length) {
      return res.status(404).json(createErrorResponse("Post not found"));
    }

    const result = await pool.query(
      "INSERT INTO forum_replies (user_id, post_id, content) VALUES ($1, $2, $3) RETURNING *",
      [user_id, post_id, content]
    );

    res.json(
      createSuccessResponse("Reply created successfully", result.rows[0])
    );
  } catch (error) {
    console.error("Error creating reply:", error);
    res.status(500).json(createErrorResponse("Error creating reply"));
  }
};
