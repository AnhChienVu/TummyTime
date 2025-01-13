// src/index.js
// This is the MAIN ENTRY POINT for our API server.
// This file will:
// 1-load the environment variables from .ENV file,
// 2-set up Error Handling
// 3-then starts the server from src/server.js

// Load environment variables from a .env file into process.env
require("dotenv").config();

const logger = require("./logger");

// If we're going to crash because of an uncaught exception, log it first.
process.on("uncaughtException", (err, origin) => {
  logger.fatal({ err, origin }, "uncaughtException");
  throw err;
});

// If we're going to crash because of an unhandled promise rejection, log it first.
process.on("unhandledRejection", (reason, promise) => {
  logger.fatal({ reason, promise }, "unhandledRejection");
  throw reason;
});

// Start our server
require("./server");
