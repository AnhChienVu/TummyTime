// src/routes/api/journal/getJournalEntry.js
const express = require("express");
const logger = require("../../../utils/logger");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("../../../utils/response");
const pool = require("../../../../database/db");

// GET /v1/getJournalEntries
module.exports = async (req, res) => {
  try {
    const userId = req.params.user_id;
    const query = "SELECT * FROM journalentry WHERE user_id = $1";
    const { rows } = await pool.query(query, [userId]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json(createErrorResponse("No journal entries found"));
    }

    res.status(200).json(createSuccessResponse(rows));
  } catch (error) {
    logger.error("Error retrieving journal entries:", error);
    res.status(500).json(createErrorResponse("Internal server error"));
  }
};
