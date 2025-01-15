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
