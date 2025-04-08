// server/src/routes/api/milestones/deleteMilestone.js

const logger = require("../../../utils/logger");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("../../../utils/response");
const pool = require("../../../../database/db");

// DELETE /v1/baby/:baby_id/milestones/:milestone_id
// Delete a Milestone record by milestone_id
module.exports.deleteMilestoneById = async (req, res) => {
  const { milestone_id } = req.params;
  const { baby_id } = req.params;

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
      "DELETE FROM milestones WHERE milestone_id = $1",
      [milestone_id]
    );

    if (result.rowCount > 0) {
      res.status(200).send(createSuccessResponse()); // 200 OK
    } else {
      res
        .status(404)
        .send(createErrorResponse(404, `Milestone record not found`)); // 404 Not Found
    }
  } catch (err) {
    logger.error(err, `Error deleting milestone`);

    res.status(500).send(createErrorResponse(500, `Internal server error`)); // 500 Internal Server Error
  }
};
