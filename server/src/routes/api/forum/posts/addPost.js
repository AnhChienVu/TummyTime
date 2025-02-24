// src/routes/api/forum/posts/addPost.js
const pool = require("../../../../../database/db");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("../../../../utils/response");
const logger = require("../../../../utils/logger");
const { getUserId } = require("../../../../utils/userIdHelper");

// POST /v1/forum/posts/add
// Create a new post
module.exports = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      logger.error("No authorization header found");
      return createErrorResponse(res, 401, "No authorization token provided");
    }

    const userId = await getUserId(authHeader);
    if (!userId) {
      return createErrorResponse(res, 404, "User not found");
    }

    const { title, content } = req.body;

    if (!title || !content) {
      return createErrorResponse(res, 400, "Title and content are required");
    }

    const result = await pool.query(
      "INSERT INTO forumpost (user_id, title, content) VALUES ($1, $2, $3) RETURNING *",
      [userId, title, content]
    );

    return res
      .status(201)
      .json(createSuccessResponse("Post created successfully", result.rows[0]));
  } catch (error) {
    logger.error(`Error creating post: ${error.message}`);
    return res.status(500).json(createErrorResponse("Error creating post"));
  }
};
