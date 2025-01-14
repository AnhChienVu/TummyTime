// src/routes/api/login.js

const logger = require('../../utils/logger');
const { createSuccessResponse } = require('../../utils/response');

const mockUser = {
  users: [
    {
      user_id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'test@example.com',
      password: 'password',
      role: 'Parent',
    },
  ],
};
module.exports = async (req, res) => {
  const { email, password } = req.body;
  console.log(email, password);
  const user = mockUser.users.find((user) => user.email === email);

  //   if (user && (await bcrypt.compare(password, user.password))) {
  //     res.json({ success: true });
  //   } else {
  //     res.status(401).json({ message: 'Invalid credentials' });
  //   }
  if (user && password === user.password) {
    res.json({ success: true });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
};
