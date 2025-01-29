// server/src/routes/api/growth/getGrowth.js
// Route for GET /growth/:babyId
// Get all Growth records for a specific [:babyId]

const logger = require('../../../utils/logger');
const { createSuccessResponse, createErrorResponse } = require('../../../utils/response');
const pool = require('../../../../database/db');

// GET /growth/:babyId - Get multiple Growth records by [:babyId]
module.exports.getGrowthByBabyId = async (req, res) => {
  const { babyId } = req.params;

  try {
    const result = await pool.query('SELECT * FROM growth WHERE baby_id = $1', [babyId]);

    if (result.rows.length > 0) {
      res.status(200).send(createSuccessResponse(result.rows)); // 200 OK with multiple records
    } else {
      res
        .status(404)
        .send(createErrorResponse(404, `No growth records found for babyId: ${babyId}`)); // 404 Not Found
    }
  } catch (err) {
    logger.error(
      err,
      `ERROR in GET /growth/:babyId, Error fetching growth records for [babyId] ${babyId}`
    );

    res.status(500).send(createErrorResponse(500, `Internal server error`)); // 500 Internal Server Error
  }
};
