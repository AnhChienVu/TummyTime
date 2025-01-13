// src/app.js
// This file will:
// 1-Start an Express app
// 2-Add middleware to the app
// 3-Set up authentication middleware
// 4-Add all the routes

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");

const logger = require("./logger");
const pino = require("pino-http")({
  // Use our default logger instance, which is already configured
  logger,
});

const { createErrorResponse } = require("./response");
const app = express();
app.use(pino);

app.use(helmet());
app.use(cors());
app.use(compression());

const path = require("path");
const authenticate = require(path.join(__dirname, "auth", "index.js"));

const passport = require("passport");

// Set up our passport authentication middleware
passport.use(authenticate.strategy());
app.use(passport.initialize());

app.use("/", require("./routes"));

// Add 404 middleware to handle any requests for resources that can't be found
app.use((req, res) => {
  const errorResponse = createErrorResponse(404, "not found");

  res.status(404).json(errorResponse);
});

// Add error-handling middleware to deal with anything else
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || "unable to process request";

  const errorResponse = createErrorResponse(status, message);

  if (status > 499) {
    logger.error({ err }, `Error processing request`);
  }

  res.status(status).json(errorResponse);
});

module.exports = app;
