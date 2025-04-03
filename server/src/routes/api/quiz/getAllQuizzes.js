// server/src/routes/api/quiz/getAllQuizzes.js
// Route for GET /quiz

// NOTE-: =>[NO AUTHENTICATION] REQUIRED FOR THIS ROUTE (everyone can access)

const logger = require('../../../utils/logger');
const { createSuccessResponse, createErrorResponse } = require('../../../utils/response');
const pool = require('../../../../database/db');

// GET /quiz
module.exports = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM coupons');

    if (result.rows.length > 0) {
      // return ALL ROWS
      res.status(200).send(createSuccessResponse({ data: result.rows }));
    } else {
      res.status(404).send(createErrorResponse(404, 'No coupons found'));
    }
  } catch (err) {
    logger.error(err, `ERROR in getAll___(), Error fetching all coupons`);
    res.status(500).json(createErrorResponse(500, 'Internal server error'));
  }
};
