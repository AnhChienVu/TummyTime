// src/routes/api/signup.js

const bcrypt = require('bcryptjs');
const logger = require('../../utils/logger');
const {
  createSuccessResponse,
  createErrorResponse,
} = require('../../utils/response');
const mockData = require('../../model/mockDb');
const validatePassword = require('../../utils/validatePassword');

const users = mockData.users;

module.exports = async (req, res) => {
  const { firstName, lastName, email, password, confirmPassword, role } =
    req.body;
  if (password !== confirmPassword) {
    return res.status(400).json(400, 'Passwords do not match');
  }

  if (users.find((user) => user.email === email)) {
    return res.status(400).json(400, 'User already exists');
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return res.status(400).json(400, passwordValidation.message);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = {
    id: users.length + 1,
    firstName,
    lastName,
    email,
    password: hashedPassword,
    role,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);

  return res.json({ success: true });
};
