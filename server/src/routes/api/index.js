// src/routes/api/index.js

/**
 * The main entry-point for the v1 version of the API.
 */
const express = require('express');

// Create a router on which to mount our API endpoints
const router = express.Router();

router.post('/login', require('./login'));

router.post('/signup', require('./signup'));

module.exports = router;
