// jest.config.js
// #This will load our env.jest test environment variables and set various options for how the tests will run

const path = require('path');
const envFile = path.join(__dirname, 'env.jest');

require('dotenv').config({ path: envFile });

console.log(`Using LOG_LEVEL=${process.env.LOG_LEVEL}. Use 'debug' in env.jest for more detail`);

// Set our Jest options, see https://jestjs.io/docs/configuration
module.exports = {
  verbose: true,
  testTimeout: 5000,
};
