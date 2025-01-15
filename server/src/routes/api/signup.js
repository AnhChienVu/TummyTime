// src/routes/api/signup.js

const bcrypt = require('bcryptjs');
const logger = require('../../utils/logger');
const {
  createSuccessResponse,
  createErrorResponse,
} = require('../../utils/response');
const mockData = require('../../model/mockDb');
const validatePassword = require('../../utils/validatePassword');
const pool = require('../../../database/db');

const users = mockData.users;

module.exports = async (req, res) => {
  const { firstName, lastName, email, password, confirmPassword, role } =
    req.body;
  try {
    if (password !== confirmPassword) {
      return res
        .status(400)
        .json(createErrorResponse(400, 'Passwords do not match'));
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res
        .status(400)
        .json(createErrorResponse(400, passwordValidation.message));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Use Postgres database
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [
      email,
    ]);
    const user = result.rows[0];

    if (user) {
      return res
        .status(400)
        .json(createErrorResponse(400, 'User already exists'));
    }

    const newUser = await pool.query(
      'INSERT INTO users (first_name, last_name, email, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [firstName, lastName, email, hashedPassword, role]
    );

    // Return the newly created user from the database
    return res.json(createSuccessResponse(newUser.rows[0]));
  } catch (error) {
    logger.error(error);
    return res
      .status(500)
      .json(createErrorResponse(500, 'Internal server error'));
  }
};
