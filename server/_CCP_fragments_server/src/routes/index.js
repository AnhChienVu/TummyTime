// src/routes/index.js

const express = require('express');
const { version, author, githubUrl } = require('../../package.json');
const router = express.Router();
const { hostname } = require('os');
const { authenticate } = require('../auth');

const { createSuccessResponse } = require('../response');

/**
 * NOTE-:Expose all of our API routes on /v1/* to include an API version.
 * Protect them all with middleware so you have to be authenticated
 * in order to access things.
 */
router.use(`/v1`, authenticate(), require('./api'));

/**
 * NOTE-:Define a simple health check route. If the server is running
 * we'll respond with a 200 OK.  If not, the server isn't healthy.
 * This route is NOT PROTECTED by the authenticate() middleware.
 */
router.get('/', (req, res) => {
  // Client's shouldn't cache this response (always request it fresh)
  res.setHeader('Cache-Control', 'no-cache');
  res.status(200).json(
    createSuccessResponse({
      author,
      githubUrl,
      version,
      hostname: hostname(),
    })
  );
});

module.exports = router;
