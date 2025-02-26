// src/routes/api/journal/putJournalEntry.js
const pool = require("../../../../database/db");
const { getUserId } = require("../../../utils/userIdHelper");

// PUT /v1/journal/:id
// Update a journal entry
module.exports = async (req, res) => {
  try {
    // Validate entry_id
    const entryId = parseInt(req.params.id);
    if (isNaN(entryId) || entryId <= 0) {
      return res.status(400).json({
        error: "Invalid entry ID provided",
      });
    }

    // Validate authorization header
    if (!req.headers.authorization) {
      return res.status(401).json({
        error: "No authorization token provided",
      });
    }

    // Validate request body
    const { title, text } = req.body;
    if (!title || !text) {
      return res.status(400).json({
        error: "Title and text are required",
      });
    }

    const userId = await getUserId(req.headers.authorization);
    if (!userId) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    // Check if entry exists and belongs to user
    const entryResult = await pool.query(
      "SELECT user_id FROM journalentry WHERE entry_id = $1",
      [entryId]
    );

    if (entryResult.rows.length === 0) {
      return res.status(404).json({
        error: "Journal entry not found",
      });
    }

    if (entryResult.rows[0].user_id !== userId) {
      return res.status(403).json({
        error: "You can only edit your own journal entries",
      });
    }

    // Update the entry
    const result = await pool.query(
      "UPDATE journalentry SET title = $1, text = $2, updated_at = NOW() WHERE entry_id = $3 RETURNING *",
      [title, text, entryId]
    );

    return res.status(200).json({
      status: "ok",
      data: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({
      error: "Database error",
    });
  }
};
