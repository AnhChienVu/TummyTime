// client/src/routes/api/growth/getGrowth.js
// Route for GET /growth/:growthId

const logger = require('../../../utils/logger');
const { createSuccessResponse, createErrorResponse } = require('../../../utils/response');
const pool = require('../../../../database/db');

// GET /growth/:growthId    -GET a Growth record by growthId
module.exports.getGrowthById = async (req, res) => {
  const { growthId } = req.params;

  try {
    const result = await pool.query('SELECT * FROM growth WHERE growth_id = $1', [growthId]);

    if (result.rows.length > 0) {
      res.status(200).send(createSuccessResponse(result.rows[0])); // 200 OK
    } else {
      res.status(404).send(createErrorResponse(404, `Growth record not found`)); // 404
    }
  } catch (err) {
    logger.error(
      err,
      `ERROR in GET /growth/:growthId, Error getting growth record with id ${growthId}`
    );

    res.status(500).send(createErrorResponse(500, `Internal server error`)); // 500 Internal Server Error
  }
};
