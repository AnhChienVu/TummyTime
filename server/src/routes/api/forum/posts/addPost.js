// src/routes/api/forum/posts/addForumPost.js
const pool = require("../../../../../database/db");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("../../../../utils/response");

module.exports = async (req, res) => {
  const { user_id, title, content } = req.body;

  try {
    const result = await pool.query(
      "INSERT INTO forumpost (user_id, title, content) VALUES ($1, $2, $3) RETURNING *",
      [user_id, title, content]
    );

    res.json(
      createSuccessResponse("Post created successfully", result.rows[0])
    );
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json(createErrorResponse("Error creating post"));
  }
};
