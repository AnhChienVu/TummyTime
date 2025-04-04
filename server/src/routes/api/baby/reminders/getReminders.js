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

    try {
      // Get user ID from auth token
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        logger.error('No authorization header found');
        return res.status(401).json(createErrorResponse(401, 'No authorization token provided'));
      }

      const userId = await getUserId(authHeader);
      if (!userId) {
        return res.status(404).json(createErrorResponse(404, 'User not found'));
      }

      // Check if the baby belongs to the user
      const hasBabyAccess = await checkBabyBelongsToUser(numericBabyId, userId);
      if (!hasBabyAccess) {
        return res
          .status(403)
          .json(createErrorResponse(403, 'Access denied: Baby does not belong to current user'));
      }

      // First check if the reminders table exists
      try {
        const tableCheck = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'reminders'
          );
        `);
        
        const tableExists = tableCheck.rows[0].exists;
        
        if (!tableExists) {
          logger.warn('Reminders table does not exist in database');
          // Return empty array if table doesn't exist
          return res.status(200).json(createSuccessResponse([]));
        }
        
        // Now check that all required columns exist
        try {
          const columnCheck = await pool.query(`
            SELECT 
              COUNT(*) = 9 AS has_all_columns
            FROM 
              information_schema.columns 
            WHERE 
              table_schema = 'public' 
              AND table_name = 'reminders'
              AND column_name IN (
                'reminder_id', 'baby_id', 'title', 'date', 
                'notes', 'is_active', 'next_reminder', 
                'reminder_in', 'time'
              );
          `);
          
          const hasAllColumns = columnCheck.rows[0].has_all_columns;
          
          if (!hasAllColumns) {
            logger.warn('Reminders table is missing required columns');
            // Return empty array if columns are missing
            return res.status(200).json(createSuccessResponse([]));
          }
        } catch (columnError) {
          logger.error('Error checking reminders table columns:', columnError);
          // Return empty array on error
          return res.status(200).json(createSuccessResponse([]));
        }
      } catch (tableError) {
        logger.error('Error checking if reminders table exists:', tableError);
        // Return empty array on error
        return res.status(200).json(createSuccessResponse([]));
      }

      // If we get here, the table and columns exist, so try to fetch the reminders
      try {
        const result = await pool.query(
          `SELECT 
            reminder_id,
            baby_id,
            title,
            TO_CHAR(date, 'YYYY-MM-DD') AS date,
            time,
            notes,
            is_active,
            next_reminder,
            reminder_in,
            created_at,
            updated_at
          FROM reminders 
          WHERE baby_id = $1 
          ORDER BY date DESC, time ASC`,
          [numericBabyId]
        );

        logger.info(`Found ${result.rows.length} reminders for babyId=${numericBabyId}`);
        return res.status(200).json(createSuccessResponse(result.rows));
      } catch (queryError) {
        logger.error('Error querying reminders:', queryError);
        // If the query fails for any reason, return an empty array
        return res.status(200).json(createSuccessResponse([]));
      }
    } catch (authError) {
      logger.error('Auth error in getReminders:', authError);
      return res.status(401).json(createErrorResponse(401, 'Authentication error'));
    }
  } catch (error) {
    logger.error('Unexpected error in getReminders:', error);
    return res.status(200).json(createSuccessResponse([]));
  }
};