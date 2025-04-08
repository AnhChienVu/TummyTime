// server/src/routes/api/growth/putGrowth.js
// Route for PUT /baby/[:babyId]/growth/[:growthId]

const logger = require('../../../utils/logger');
const { createSuccessResponse, createErrorResponse } = require('../../../utils/response');
const pool = require('../../../../database/db');

// PUT /baby/:babyId/growth/[:growthId] - Update a Growth record by [:growthId]
module.exports.updateGrowthById = async (req, res) => {
  const { growthId } = req.params;
  const { date, height, weight, notes } = req.body;
  const baby_id = req.params.baby_id;

  logger.info(
    `In PUT /baby/:babyId/growth/:growthId, Updating growth record with growthId ${growthId}`
  );
  logger.info(`date: ${date}, height: ${height}, weight: ${weight}, notes: ${notes}`);

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
      'UPDATE growth SET date = $1, height = $2, weight = $3, notes = $4 WHERE growth_id = $5 RETURNING *',
      [date, height, weight, notes, growthId]
    );
    if (result.rows.length > 0) {
      res.status(200).send(createSuccessResponse(result.rows[0])); // 200 OK
    } else {
      res.status(404).send(createErrorResponse(404, `Growth record not found`)); // 404 Not Found
    }
  } catch (err) {
    logger.error(
      err,
      `ERROR in PUT /baby/:babyId/growth/:growthId, Error updating growth record with id ${growthId}`
    );

    res.status(500).send(createErrorResponse(500, `Internal server error`)); // 500 Internal Server Error
  }
};
