// src/utils/userIdHelper.js
// Helper function to get user ID by email
const pool = require("../../database/db");
const logger = require("./logger");

async function getUserIdByEmail(email) {
  try {
    if (!email || typeof email !== "string") {
      logger.error("Invalid email parameter provided");
      return null;
    }

    const result = await pool.query(
      `SELECT user_id
       FROM users
       WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      logger.error(`User not found for email: ${email}`);
      return null;
    }

    return result.rows[0].user_id; // return the user ID
  } catch (error) {
    logger.error(
      `Error retrieving user ID for email ${email}: ${error.message}`
    );
    throw error;
  }
}

module.exports = {
  getUserIdByEmail,
};
