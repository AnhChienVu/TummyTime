// server/src/routes/api/milestones/postMilestone.js

const logger = require("../../../utils/logger");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("../../../utils/response");
const pool = require("../../../../database/db");

// POST /v1/baby/:baby_id/milestones
// Create a new milestone
module.exports.createMilestone = async (req, res) => {
  const { date, title, details } = req.body;
  const baby_id = req.params.baby_id;

  try { 
    // Decode the token to get the user ID
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        status: "error",
        error: {
          message: "No authorization token provided",
        },
      });
    }

    const user_id = await getUserId(authHeader);
    if (!user_id) {
      return res.status(404).json({
        status: "error",
        error: {
          message: "User not found",
        },
      });
    }

   // {CHECK OWNERSHIP of BABY}
    // Verify user has access to this baby
    const hasAccess = await checkBabyBelongsToUser(baby_id, user_id);
    if (!hasAccess) {
      return res
        .status(403)
        .json(
          createErrorResponse("Not authorized to access this baby profile")
        );
    }

    const result = await pool.query(
      "INSERT INTO milestones (baby_id, date, title, details) VALUES ($1, $2, $3, $4) RETURNING *",
      [baby_id, date, title, details]
    );

    res.status(201).send(createSuccessResponse(result.rows[0])); // 201 Created
  } catch (err) {
    logger.error(err, `ERROR in POST /milestones, Error creating milestone`);

    res.status(500).send(createErrorResponse(500, `Internal server error`)); // 500 Internal Server Error
  }
};
