// src/routes/api/getBabyProfiles.js
const pool = require('../../../database/db');
const {
  createSuccessResponse,
  createErrorResponse,
} = require('../../utils/response');

module.exports = async (req, res) => {
  const userId = req.params.id;
  try {
    const babyProfiles = await pool.query(
      `SELECT b.* FROM baby b
      JOIN user_baby ub ON b.baby_id = ub.baby_id
      JOIN users u ON u.user_id = ub.user_id
      where u.user_id = $1`,
      [userId]
    );
    return res.json(createSuccessResponse(babyProfiles.rows));
  } catch (error) {
    console.error('Database query error:', error);
    return res
      .status(500)
      .json(createErrorResponse(500, 'Internal server error'));
  }
};
