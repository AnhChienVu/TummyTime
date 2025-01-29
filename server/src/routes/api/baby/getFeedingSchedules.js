// src/routes/api/getFeedingSchedules.js
const pool = require('../../../../database/db');
const {
  createSuccessResponse,
  createErrorResponse,
} = require('../../../utils/response');

module.exports = async (req, res) => {
  const { id } = req.params;
  try {
    const feedingSchedules = await pool.query(
      'SELECT * FROM feedingschedule where baby_id=$1',
      [id]
    );
    console.log('feeding schedules: ', feedingSchedules);
    return res.json(createSuccessResponse(feedingSchedules.rows));
  } catch (error) {
    console.error('Database query error:', error);
    return res
      .status(500)
      .json(createErrorResponse(500, 'Internal server error'));
  }
};
