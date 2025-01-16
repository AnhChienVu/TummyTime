// src/routes/api/login.js

const bcrypt = require('bcryptjs');
const logger = require('../../utils/logger');
const {
  createSuccessResponse,
  createErrorResponse,
} = require('../../utils/response');
const mockData = require('../../model/mockDb');
const { generateToken } = require('../../utils/jwt');

const users = mockData.users;

module.exports = async (req, res) => {
  const { email, password } = req.body;

  const user = users.find((user) => user.email === email);

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
};
