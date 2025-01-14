const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const validatePassword = require('./utils/validatePassword');
const { createErrorResponse } = require('./utils/response');

const mainRouter = require('./routes'); // Import the API router

const logger = require('./utils/logger');
const pino = require('pino-http')({
  logger,
});

const app = express();
app.use(pino);
app.use(cors());
app.use(express.json());
app.use('/', mainRouter); // Mount the main router
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

// Define our routes
// The second parameter passed to app.use is the middleware function or the module containing middelware
// functions
// app.get('/', require('./routes'));

app.use((req, res) => {
  res.status(404).json(
    createErrorResponse({
      error: {
        message: 'not found',
        code: 404,
      },
    })
  );
});

module.exports = app;

// app.post('/login', async (req, res) => {
//   const { email, password } = req.body;
//   const user = mockUser.users.find((user) => user.email === email);

//   if (user && (await bcrypt.compare(password, user.password))) {
//     res.json({ success: true });
//   } else {
//     res.status(401).json({ message: 'Invalid credentials' });
//   }
// });

// app.post('/register', async (req, res) => {
//   const { firstName, lastName, email, password, confirmPassword, role } =
//     req.body;
//   if (password !== confirmPassword) {
//     return res
//       .status(400)
//       .json({ success: false, message: 'Passwords do not match' });
//   }

//   if (mockUser.users.find((user) => user.email === email)) {
//     return res
//       .status(400)
//       .json({ success: false, message: 'User already exists' });
//   }

//   const passwordValidation = validatePassword(password);
//   if (!passwordValidation.valid) {
//     return res
//       .status(400)
//       .json({ success: false, message: passwordValidation.message });
//   }

//   const hashedPassword = await bcrypt.hash(password, 10);

//   const newUser = {
//     id: mockUser.users.length + 1,
//     firstName,
//     lastName,
//     email,
//     password: hashedPassword,
//     role,
//   };

//   mockUser.users.push(newUser);

//   return res.json({ success: true });
// });

// app.listen(process.env.PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });
