// src/routes/api/users/getUsers.js
// All GET /users routes

const logger = require('../../../utils/logger');
const { createSuccessResponse, createErrorResponse } = require('../../../utils/response');
const pool = require('../../../../database/db'); 

/**
 * route: GET /users/:id
 * GET an existing user
 */
module.exports.getUserById = async (req, res) => { 
  const { id } = req.params; 

  try { 
    const user = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return res.status(200).json(createSuccessResponse(user.rows[0]));
  } catch (err) {
    logger.error(err, `in GET /users/:id, Error getting user with id ${req.params.id}`);

    return res.status(500).json(createErrorResponse(500, 'Internal server error'));
  }
};
