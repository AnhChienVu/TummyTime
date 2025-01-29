// src/routes/api/getFeedingSchedules.js
const pool = require('../../../../database/db');
const {
  createSuccessResponse,
  createErrorResponse,
} = require('../../../utils/response');

module.exports = async (req, res) => {
  const { mealId } = req.params;
  const { meal, time, type, amount, issues, notes } = req.body;

  console.log('Request body:', req.body);
  console.log('Meal id:', req.params.id);
  try {
    const updatedFeedingSchedules = await pool.query(
      'UPDATE feedingschedule SET meal = $1, time = $2, type = $3, amount = $4, issues = $5, notes = $6 WHERE feeding_schedule_id = $7 RETURNING *',
      [meal, time, type, amount, issues, notes, mealId]
    );
    console.log('Updated feeding schedules: ', updatedFeedingSchedules);
    return res.json(createSuccessResponse(updatedFeedingSchedules.rows));
  } catch (error) {
    console.error('Database query error:', error);
    return res
      .status(500)
      .json(createErrorResponse(500, 'Internal server error'));
  }
};
