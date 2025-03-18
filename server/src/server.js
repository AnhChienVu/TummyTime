// src/server.js

// We want to gracefully shutdown our server
const stoppable = require('stoppable');

// Get our logger instance
const logger = require('./utils/logger.js');

// Get our express app instance
const app = require('./app');

// Import the cache service
const careServicesCache = require('./services/careServicesCache');

// Get the desired port from the process' environment. Default to `8080`
const port = parseInt(process.env.PORT || '8080', 10);

// Initialize the cache in the background
logger.info('Initializing care services cache during server startup...');
careServicesCache.initializeCache()
  .then(() => {
    logger.info('Care services cache initialized successfully');
  })
  .catch(err => {
    logger.error(`Error initializing care services cache: ${err.message}`);
    logger.info('Server will continue starting, but care services may not be available immediately');
  });

// Start a server listening on this port
const server = stoppable(
  app.listen(port, () => {
    // Log a message that the server has started, and which port it's using.
    logger.info(`Server started on port ${port}`);
  })
);

// Handle graceful shutdown
process.on('SIGINT', () => {
    logger.info('SIGINT signal received: closing HTTP server');
    server.stop(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  });

  process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    server.stop(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  });

  
// Export our server instance so other parts of our code can access it if necessary.
module.exports = server;
