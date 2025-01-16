// src/routes/api/login.js

const bcrypt = require('bcryptjs');
const logger = require('../../utils/logger');
const {
  createSuccessResponse,
  createErrorResponse,
} = require('../../utils/response');

const pool = require('../../../database/db');
const { generateToken } = require('../../utils/jwt');

module.exports = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [
      email,
    ]);

    const user = result.rows[0];

    if (!user) {
      return res
        .status(401)
        .json(createErrorResponse(401, "User doesn't exist"));
    }

    if (user && (await bcrypt.compare(password, user.password))) {
      const token = generateToken(user);
      res.json(
        createSuccessResponse({
          success: true,
          token,
          message: 'Login successfully',
        })
      );
    } else {
      res.status(401).json(createErrorResponse(401, 'Invalid credentials'));
    }
  } catch (error) {
    return res
      .status(500)
      .json(createErrorResponse(500, 'Internal server error'));
  }
};
