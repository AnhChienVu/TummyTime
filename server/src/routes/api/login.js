// src/routes/api/login.js

const bcrypt = require('bcryptjs');
const logger = require('../../utils/logger');
const {
  createSuccessResponse,
  createErrorResponse,
} = require('../../utils/response');
const pool = require('../../../database/db');

module.exports = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [
      email,
    ]);

    const user = result.rows[0];

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json(
        createSuccessResponse({ success: true, message: 'Login successfully' })
      );
    } else {
      res.status(401).json(createErrorResponse(401, 'Invalid credentials'));
    }
  } catch (error) {
    logger.error(error);
    return res
      .status(500)
      .json(createErrorResponse(500, 'Internal server error'));
  }
};
