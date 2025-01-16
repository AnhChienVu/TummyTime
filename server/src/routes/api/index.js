// src/routes/api/index.js
const jwtMiddleware = require('../../auth/jwt-middleware');

/**
 * The main entry-point for the v1 version of the API.
 */
const express = require('express');

// Create a router on which to mount our API endpoints
const router = express.Router();

router.post('/login', require('./login'));

router.post('/signup', require('./signup'));
// Testing the jwtMiddleware
// router.get('/test', jwtMiddleware, require('./test'));
module.exports = router;
