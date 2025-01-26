// src/routes/api/users/delete.js
// All DELETE /users routes

const logger = require('../../../utils/logger');
const { createSuccessResponse, createErrorResponse } = require('../../../utils/response');
const pool = require('../../../../database/db');

/**
 * ROUTE: DELETE /users/:userId
 * DELETE a user by userId
 */
module.exports.deleteUserById = async function (req, res) {
  const { id } = req.params;

  try {
    const deletedUser = await pool.query('DELETE FROM users WHERE id = $1', [id]);
    return res.status(200).json(createSuccessResponse()); // 200 OK
  } catch (err) {
    logger.error(err, `ERROR in DELETE /users/:id, Error deleting user with id ${req.params.id}`);

    return res.status(500).json(createErrorResponse(500, `Internal server error`)); // 500 Internal Server Error
  }
};
