// src/server.js

// NOTE-:We'll change the default entry point of our server, from src/server.js to use a new file: src/index.js.

// We want to gracefully shutdown our server
const stoppable = require('stoppable');

const logger = require('./logger');
const app = require('./app'); // import the app.js file
// Get the port from the environment, or default to 8080
const port = parseInt(process.env.PORT || '8080', 10);

// Start a server listening on this port
const server = stoppable(
  app.listen(port, () => {
    logger.info(`Server started on port ${port}`);

    // IF CHECK AWS_ACCESS_KEY_ID is empty, set to 'test' for LOCALSTACK, LOCAL DYNAMODB
    if (process.env.AWS_ACCESS_KEY_ID === undefined || process.env.AWS_ACCESS_KEY_ID === '') {
      setInterval(() => {
        process.env.AWS_ACCESS_KEY_ID = 'test';
        process.env.AWS_SECRET_ACCESS_KEY = 'test';
        process.env.AWS_SESSION_TOKEN = 'test';
        process.env.AWS_REGION = 'us-east-1';
      }, 3000);
    }
  })
);

module.exports = server;
