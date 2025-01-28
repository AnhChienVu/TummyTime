// src/routes/api/user/getUsers.js
// GET /user routes

const logger = require('../../../utils/logger');
const {
  createSuccessResponse,
  createErrorResponse,
} = require('../../../utils/response');
const pool = require('../../../../database/db');

/**
 * route: GET /user/:id
 * GET an existing user
 */
module.exports.getUserById = async (req, res) => {
  const { id } = req.params;
  console.log('userId:', id);
  try {
    const profile = await pool.query('SELECT * FROM users WHERE user_id = $1', [
      id,
    ]);
    return res.json(createSuccessResponse(profile.rows[0]));
  } catch (error) {
    console.error('Database query error:', error);
    return res
      .status(500)
      .json(createErrorResponse(500, 'Internal server error'));
  }
};
