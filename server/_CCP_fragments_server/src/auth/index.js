// src/auth/index.js

// CHOOSE THE AUTHENTICATION STRATEGY based on Environment Variables
//  - Amazon Cognito
//  - .htpasswd file with path defined in `HTPASSWD_FILE = tests/.htpasswd` for non - production environments => it is accessed only in TESTS

const path = require('path');

// Prefer Amazon Cognito
if (process.env.AWS_COGNITO_POOL_ID && process.env.AWS_COGNITO_CLIENT_ID) {
  module.exports = require(path.join(__dirname, 'cognito.js'));
}
// Also allow for an .htpasswd file to be used, but not in production
else if (process.env.HTPASSWD_FILE && process.NODE_ENV !== 'production') {
  module.exports = require(path.join(__dirname, 'basic-auth.js'));
} else {
  throw new Error('missing env vars: no authorization configuration found');
}
