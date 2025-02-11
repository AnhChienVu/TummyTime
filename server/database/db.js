require('dotenv').config();
const Pool = require('pg').Pool;

// For local PostgresDB
// const pool = new Pool({
//   user: 'postgres',
//   password: process.env.POSTGRES_PASSWORD,
//   host: 'localhost',
//   port: 5432,
//   database: 'TummyTime',
// });

// For Supabase PostgresDB
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Test database connection
pool
  .connect()
  .then(() => {
    console.log('Connected to database');
  })
  .catch((err) => {
    console.error('Error connecting to database', err);
  });

module.exports = pool;
