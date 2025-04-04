// server/src/routes/api/reminders/postReminder.js
// Route for POST /baby/:babyId/reminders
// Create a new reminder for a specific baby

const logger = require('../../../../utils/logger');
const { createSuccessResponse, createErrorResponse } = require('../../../../utils/response');
const pool = require('../../../../../database/db');
const { getUserId } = require('../../../../utils/userIdHelper');
const { checkBabyBelongsToUser } = require('../../../../utils/babyAccessHelper');

// server/src/routes/api/baby/reminders/postReminder.js
// Update the response format to be consistent

module.exports.createReminder = async (req, res) => {
  const { babyId } = req.params;
  const { title, time, date, notes, isActive, nextReminder, reminderIn } = req.body;

  logger.info(`Creating reminder for babyId: ${babyId}`);

  // Validate babyId format
  const numericBabyId = parseInt(babyId, 10);
  logger.info(`Parsed babyId=${babyId} to numericBabyId=${numericBabyId}`);
  if (!/^\d+$/.test(babyId) || Number.isNaN(numericBabyId) || numericBabyId < 1) {
    logger.info(`Invalid babyId format: ${babyId}`);
    return res.status(400).json(createErrorResponse(400, 'Invalid babyId format'));
  }

  // Validate required fields
  if (!title || !date) {
    logger.info(`Missing required fields. title=${title}, date=${date}`);
    return res.status(400).json(createErrorResponse(400, 'Missing required reminder data (title, date)'));
  }

  try {
    // Get user ID from auth token
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      logger.error("No authorization header found");
      return res.status(401).json(createErrorResponse(401, "No authorization token provided"));
    }

    const userId = await getUserId(authHeader);
    if (!userId) {
      return res.status(404).json(createErrorResponse(404, "User not found"));
    }

    // Check if the baby belongs to the user
    const hasBabyAccess = await checkBabyBelongsToUser(numericBabyId, userId);
    if (!hasBabyAccess) {
      return res.status(403).json(createErrorResponse(403, "Access denied: Baby does not belong to current user"));
    }

    // First check if the reminders table exists and create it if it doesn't
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS reminders (
          reminder_id SERIAL PRIMARY KEY,
          baby_id INTEGER NOT NULL,
          title VARCHAR(255) NOT NULL,
          time VARCHAR(255),
          date DATE NOT NULL,
          notes TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          next_reminder BOOLEAN DEFAULT FALSE,
          reminder_in INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      logger.info('Ensured reminders table exists');
    } catch (tableError) {
      logger.error('Error ensuring reminders table exists:', tableError);
      return res.status(500).json(createErrorResponse(500, 'Failed to ensure database structure'));
    }

    // Insert the reminder into the database
    const insertQuery = `
      INSERT INTO reminders (baby_id, title, time, date, notes, is_active, next_reminder, reminder_in)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const result = await pool.query(insertQuery, [
      numericBabyId,
      title,
      time || null,
      date,
      notes || null,
      isActive !== undefined ? isActive : true,
      nextReminder || false,
      reminderIn || null
    ]);

    const newReminder = result.rows[0];
    logger.info(`Created reminder with ID=${newReminder.reminder_id} for babyId=${babyId}`);

    // Important: Return both success AND status fields for backwards compatibility
    return res.status(201).json({
      status: "ok",
      success: true,
      message: "Reminder created successfully",
      data: newReminder
    });

  } catch (error) {
    logger.error(error, `ERROR in POST /baby/${babyId}/reminders`);
    return res.status(500).json(createErrorResponse(500, 'Internal server error'));
  }
};