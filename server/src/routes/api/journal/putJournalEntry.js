// src/routes/api/journal/putJournalEntry.js
const pool = require("../../../../database/db");
const { createErrorResponse } = require("../../../utils/response");
const jwt = require("jsonwebtoken");
const logger = require("../../../utils/logger");
const { getUserIdByEmail } = require("../../../utils/userIdHelper");

// PUT /v1/journal/:entry_id
// Update a journal entry
module.exports = async (req, res) => {
  let client;
  try {
    const { entry_id } = req.params;
    const { title, content } = req.body;

    // Validate entry_id
    if (!entry_id || isNaN(entry_id)) {
      return createErrorResponse(res, 400, "Invalid entry ID provided");
    }

    // Validate request body
    if (!title || !content) {
      return createErrorResponse(res, 400, "Title and content are required");
    }

    // Validate authorization
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      logger.error("No authorization header found");
      return createErrorResponse(res, 401, "No authorization token provided");
    }

    // Decode the JWT token
    const token = authHeader.split(" ")[1];
    const decoded = jwt.decode(token);

    if (!decoded || !decoded.email) {
      logger.error("No email found in token payload");
      return createErrorResponse(res, 401, "Invalid token format");
    }

    // Get user_id using the helper function
    const userId = await getUserIdByEmail(decoded.email);
    if (!userId) {
      return createErrorResponse(res, 404, "User not found");
    }

    client = await pool.connect();
    await client.query("BEGIN"); // Start transaction with BEGIN (ensures that the query is atomic since we are doing multiple queries)

    // Check if entry exists and user is the author
    const checkEntryQuery = `
      SELECT user_id 
      FROM journalentry 
      WHERE entry_id = $1
    `;
    const entryResult = await client.query(checkEntryQuery, [entry_id]);

    if (entryResult.rows.length === 0) {
      logger.warn(`Journal entry not found with ID: ${entry_id}`);
      return createErrorResponse(res, 404, "Journal entry not found");
    }

    if (entryResult.rows[0].entry_id !== userId) {
      return createErrorResponse(
        res,
        403,
        "You can only edit your own journal entries"
      );
    }

    // Update the journal entry
    const updateQuery = `
      UPDATE journalentry 
      SET title = $1, 
          content = $2, 
          updated_at = CURRENT_TIMESTAMP 
      WHERE entry_id = $3 
      RETURNING entry_id, title, content, updated_at
    `;

    const result = await client.query(updateQuery, [title, content, entry_id]);
    await client.query("COMMIT");

    return res.status(200).json({
      status: "ok",
      data: result.rows[0],
    });
  } catch (error) {
    if (client) {
      await client.query("ROLLBACK");
    }
    logger.error(`Error updating journal entry: ${error.message}`);
    return createErrorResponse(res, 500, error.message);
  } finally {
    if (client) {
      client.release();
    }
  }
};
