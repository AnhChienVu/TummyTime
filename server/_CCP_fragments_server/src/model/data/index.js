// src/model/data/index.js

// Pick the appropriate back-end data strategy
const path = require('path');
let memory = path.join(__dirname, 'memory', 'index.js ');
let aws = path.join(__dirname, 'aws', 'index.js ');

// If the environment sets an AWS_REGION,
// we'll use AWS backend services (S3, DynamoDB);
// otherwise, we'll use an in-memory db.
module.exports = process.env.AWS_REGION ? require(aws) : require(memory);
