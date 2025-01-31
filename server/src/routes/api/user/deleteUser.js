// src/routes/api/users/delete.js
// All DELETE /users routes

const logger = require('../../../utils/logger');
const {
  createSuccessResponse,
  createErrorResponse,
} = require('../../../utils/response');
const pool = require('../../../../database/db');

/**
 * ROUTE: DELETE /user/:id
 * DELETE a user by userId
 */
module.exports.deleteUserById = async function (req, res) {
  const { id } = req.params;

  try {
    // DELETE entries from user_baby table
    const userBabyResult = await pool.query(
      'DELETE FROM user_baby WHERE user_id = $1 RETURNING baby_id',
      [id]
    );

    // Extract baby_id from the deleted entries
    const babyIds = userBabyResult.rows.map((row) => row.baby_id);

    // DELETE entries from babies table
    if (babyIds.length > 0) {
      await pool.query('DELETE FROM baby WHERE baby_id = ANY($1)', [babyIds]);
    }

    // DELETE user from users table
    await pool.query('DELETE FROM users WHERE user_id = $1', [id]);

    return res
      .status(200)
      .json(
        createSuccessResponse({
          message: 'User and related entries deleted successfully',
        })
      ); // 200 OK
  } catch (err) {
    logger.error(
      err,
      `ERROR in DELETE /users/:id, Error deleting user with id ${req.params.id}`
    );

    return res
      .status(500)
      .json(createErrorResponse(500, `Internal server error`)); // 500 Internal Server Error
  }
};
