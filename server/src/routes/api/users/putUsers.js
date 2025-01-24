// src/routes/api/users/put.js
// All PUT /users routes

const logger = require('../../../utils/logger');
const { createSuccessResponse, createErrorResponse } = require('../../../utils/response');
const pool = require('../../../../database/db'); 

/**
 * ROUTE: PUT /users/:id
 * Update an existing user with new data
 */
module.exports.updateUserById = async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, email, role } = req.body;

  try {
    const updatedUser = await pool.query(
      'UPDATE users SET first_name = $1, last_name = $2, email = $3, role = $4 WHERE id = $5 RETURNING *',
      [firstName, lastName, email, role, id]
    );
    
    return res.status(200).json(createSuccessResponse(updatedUser.rows[0]));
  } catch (err) {
    logger.error(err, `in PUT /users/:id, Error updating user with id ${req.params.id}`);

    return res.status(500).json(createErrorResponse(500, 'Internal server error'));
  }
};
