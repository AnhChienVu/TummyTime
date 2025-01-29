// server/src/routes/api/growth/postGrowth.js
// Route for POST /growth

const logger = require('../../../utils/logger');
const { createSuccessResponse, createErrorResponse } = require('../../../utils/response');
const pool = require('../../../../database/db');

// POST /growth     -POST a new Growth record
module.exports.createGrowth = async (req, res) => {
  const { baby_id, date, height, weight, notes } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO growth (baby_id, date, height, weight, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [baby_id, date, height, weight, notes]
    );

    res.status(201).send(createSuccessResponse(result.rows[0])); // 201 Created
  } catch (err) {
    logger.error(err, `ERROR in POST /growth, Error creating growth record`);

    res.status(500).send(createErrorResponse(500, `Internal server error`)); // 500 Internal Server Error
  }
};
