// src/utils/userIdHelper.js
const pool = require("../../database/db");
const logger = require("./logger");

/**
 * Retrieves a user's ID from the database using their email address
 *
 * @param {string} email - The email address of the user to look up
 * @returns {Promise<number|null>} The user's ID if found, null if not found or invalid email
 * @throws {Error} If there's a database error during the query
 */
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
