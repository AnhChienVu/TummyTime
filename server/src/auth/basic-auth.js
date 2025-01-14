// src/auth/basic-auth.js
// This module provides a basic authentication strategy for Passport.js.

const path = require('path');
const authorize = require(path.join(__dirname, 'auth-middleware.js '));

const auth = require('http-auth');
const authPassport = require('http-auth-passport');

// We expect HTPASSWD_FILE to be defined.
if (!process.env.HTPASSWD_FILE) {
  throw new Error('missing expected env var: HTPASSWD_FILE');
}

module.exports.strategy = () =>
  // For our Passport authentication strategy, we'll look for a
  // username/password pair in the Authorization header.
  authPassport(
    auth.basic({
      file: process.env.HTPASSWD_FILE,
    })
  );

module.exports.authenticate = () => authorize('http');
