require('dotenv').config();
const { Pool } = require('pg');

const childcarePool = new Pool({
  connectionString: process.env.CHILDCARE_SERVICES_DB,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Test database connection
childcarePool
  .connect()
  .then(() => {
    console.log('Connected to childcare services database');
  })
  .catch((err) => {
    console.error('Error connecting to childcare services database', err);
  });

module.exports = childcarePool;