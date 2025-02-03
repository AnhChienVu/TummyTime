// src/routes/api/getFeedingSchedules.js
const pool = require('../../../../database/db');
const {
  createSuccessResponse,
  createErrorResponse,
} = require('../../../utils/response');

module.exports = async (req, res) => {
  const { id } = req.params;
  const { meal, time, type, amount, issues, notes, date } = req.body;

  try {
    const addedFeedingSchedules = await pool.query(
      'INSERT INTO feedingschedule (baby_id, meal, time, type, amount, issues, notes, date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [id, meal, time, type, amount, issues, notes, date]
    );
    console.log('Added feeding schedules: ', addedFeedingSchedules);
    return res.json(createSuccessResponse(addedFeedingSchedules.rows));
  } catch (error) {
    console.error('Database query error:', error);
    return res
      .status(500)
      .json(createErrorResponse(500, 'Internal server error'));
  }
};
