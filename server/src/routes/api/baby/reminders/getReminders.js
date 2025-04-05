// server/src/routes/api/baby/reminders/getReminders.js
const logger = require('../../../../utils/logger');
const { createSuccessResponse, createErrorResponse } = require('../../../../utils/response');
const pool = require('../../../../../database/db');
const { getUserId } = require('../../../../utils/userIdHelper');
const { checkBabyBelongsToUser } = require('../../../../utils/babyAccessHelper');

module.exports.getReminders = async (req, res) => {
  try {
    const { babyId } = req.params;
    logger.info(`Fetching reminders for babyId: ${babyId}`);

    // Validate babyId format
    const numericBabyId = parseInt(babyId, 10);
    logger.info(`Parsed babyId=${babyId} to numericBabyId=${numericBabyId}`);
    if (!/^\d+$/.test(babyId) || Number.isNaN(numericBabyId) || numericBabyId < 1) {
      logger.info(`Invalid babyId format: ${babyId}`);
      return res.status(400).json(createErrorResponse(400, 'Invalid babyId format'));
    }

    // Get user ID from auth token
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      logger.error('No authorization header found');
      return res.status(401).json(createErrorResponse(401, 'No authorization token provided'));
      logger.error('No authorization header found');
      return res.status(401).json(createErrorResponse(401, 'No authorization token provided'));
    }

    const userId = await getUserId(authHeader);
    if (!userId) {
      return res.status(404).json(createErrorResponse(404, 'User not found'));
      return res.status(404).json(createErrorResponse(404, 'User not found'));
    }

    // Check if the baby belongs to the user
    const hasBabyAccess = await checkBabyBelongsToUser(numericBabyId, userId);
    if (!hasBabyAccess) {
      return res
        .status(403)
        .json(createErrorResponse(403, 'Access denied: Baby does not belong to current user'));
      return res
        .status(403)
        .json(createErrorResponse(403, 'Access denied: Baby does not belong to current user'));
    }

    // Fetch reminders for the baby, ordered by date and time
    const result = await pool.query(
      `SELECT 
        reminder_id,
        baby_id,
        title,
        TO_CHAR(date, 'YYYY-MM-DD') AS date,
        notes,
        is_active,
        next_reminder,
        reminder_in,
        created_at,
        updated_at
      FROM reminders WHERE baby_id = $1 ORDER BY date DESC, time ASC`,
      [numericBabyId]
    );

    if (result.rows.length === 0) {
      logger.info(`No reminders found for babyId: ${numericBabyId}`);
      return res.status(200).json(createSuccessResponse([])); // Return empty array instead of 404
    }

    logger.info(`Found ${result.rows.length} reminders for babyId=${numericBabyId}`);
    return res.status(200).json(createSuccessResponse(result.rows));
  } catch (error) {
    logger.error('Unexpected error in getReminders:', error);
    return res.status(500).json(createErrorResponse(500, 'Internal server error'));
  }
};