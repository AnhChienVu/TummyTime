// server/src/routes/api/milestones/getMilestone.js
// Route for GET /milestones/:milestoneId

const logger = require('../../../utils/logger');
const {
  createSuccessResponse,
  createErrorResponse,
} = require('../../../utils/response');
const pool = require('../../../../database/db');

// GET /milestones/:milestoneId - GET a Milestone record by milestoneId
module.exports.getMilestoneByBabyId = async (req, res) => {
  const { baby_id } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM milestones WHERE baby_id = $1',
      [baby_id]
    );

    if (result.rows.length > 0) {
      res.status(200).send(createSuccessResponse(result.rows)); // 200 OK
    } else {
      res
        .status(404)
        .send(createErrorResponse(404, `Milestone record not found`)); // 404 Not Found
    }
  } catch (err) {
    logger.error(
      err,
      `ERROR in GET /milestones/:milestoneId, Error fetching milestone`
    );

    res.status(500).send(createErrorResponse(500, `Internal server error`)); // 500 Internal Server Error
  }
};
