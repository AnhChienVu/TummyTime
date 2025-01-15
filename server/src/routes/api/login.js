// src/routes/api/login.js

const bcrypt = require('bcryptjs');
const logger = require('../../utils/logger');
const {
  createSuccessResponse,
  createErrorResponse,
} = require('../../utils/response');
const mockData = require('../../model/mockDb');

const users = mockData.users;

module.exports = async (req, res) => {
  const { email, password } = req.body;

  const user = users.find((user) => user.email === email);

  if (user && (await bcrypt.compare(password, user.password))) {
    res.json(
      createSuccessResponse({ success: true, message: 'Login successfully' })
    );
  } else {
    res.status(401).json(createErrorResponse(401, 'Invalid credentials'));
  }
};
