// server/src/routes/api/baby/stool/postStool.js
// Route for POST /baby/:babyId/stool/:stoolId
// Post stool entry for a specific baby

const logger = require('../../../../utils/logger');
const { createSuccessResponse, createErrorResponse } = require('../../../../utils/response');
const pool = require('../../../../../database/db');
const jwt = require('jsonwebtoken');

module.exports.createStoolEntry = async (req, res) => {
  const { babyId } = req.params;
  const { color, consistency, notes, timestamp } = req.body;

  logger.info(`Attempting to create a new stool entry for babyId: ${babyId}`);

  // Validate babyId format: Ensure it contains only digits and is a positive number.
  // This prevents partially numeric values (e.g., "3absc") from being accepted.
  const numericBabyId = parseInt(babyId, 10);
  logger.info(`Parsed babyId=${babyId} to numericBabyId=${numericBabyId}`);
  if (!/^\d+$/.test(babyId) || Number.isNaN(numericBabyId) || numericBabyId < 1) {
    logger.info(`Invalid babyId format: ${babyId}`);
    return res.status(400).json(createErrorResponse(400, 'Invalid babyId format'));
  }

  try {
    // Decode JWT token from Authorization header to extract user's email.
    // Note: jwt.decode does not verify the token signature.
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      logger.warn('No authorization header found');
      return res.status(401).json(createErrorResponse(401, 'No authorization token provided'));
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      logger.warn('No token after "Bearer"');
      return res.status(401).json(createErrorResponse(401, 'Invalid token format'));
    }

    const decoded = jwt.decode(token);
    if (!decoded || !decoded.email) {
      logger.warn('No email found in token payload', { decoded });
      return res.status(401).json(createErrorResponse(401, 'Invalid token format'));
    }

    const userEmail = decoded.email;
    logger.info(`Decoded userEmail=${userEmail} from token`);

    // Look up user_id from users table by email.
    const userResult = await pool.query('SELECT user_id FROM users WHERE email = $1', [userEmail]);
    if (userResult.rows.length === 0) {
      logger.warn(`User not found in DB for email=${userEmail}`);
      return res.status(404).json(createErrorResponse(404, 'User not found'));
    }

    const localUserId = userResult.rows[0].user_id;
    logger.info(`Mapped email=${userEmail} to local user_id=${localUserId}`);

    // Check if the baby exists in the baby table.
    const babyCheck = await pool.query('SELECT baby_id FROM baby WHERE baby_id=$1', [numericBabyId]);
    if (babyCheck.rows.length === 0) {
      logger.info(`No baby found with baby_id=${babyId}`);
      return res.status(404).json(createErrorResponse(404, 'Baby not found'));
    }

   // {CHECK OWNERSHIP of BABY}
    // Verify user has access to this baby 
    // Check user ownership in user_baby table to ensure the user is authorized.
    const ownershipRes = await pool.query(
      'SELECT user_id, baby_id FROM user_baby WHERE user_id=$1 AND baby_id=$2',
      [localUserId, numericBabyId]
    );
    if (ownershipRes.rows.length === 0) {
      logger.info(`User ${localUserId} not authorized for babyId=${babyId}`);
      return res.status(403).json(createErrorResponse(403, 'Forbidden'));
    }

    // Validate required stool entry fields: color and consistency are mandatory.
    if (!color || !consistency) {
      logger.info(`Missing color or consistency. color=${color}, consistency=${consistency}`);
      return res.status(400).json(createErrorResponse(400, 'Missing required stool data (color, consistency)'));
    }

    // Insert stool entry into the database.
    const insertQuery = `
      INSERT INTO stool_entries (baby_id, color, consistency, notes, timestamp)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const stoolResult = await pool.query(insertQuery, [
      numericBabyId,
      color,
      consistency,
      notes || null,
      timestamp || new Date(),
    ]);

    const newStool = stoolResult.rows[0];
    logger.info(`Created stool entry with ID=${newStool.stool_id} for babyId=${babyId}`);

    // Return success response with the newly created stool entry.
    return res.status(201).json(createSuccessResponse(newStool));
  } catch (error) {
    logger.error(error, `ERROR in POST /baby/${babyId}/stool - Failed to create stool entry`);
    return res.status(500).json(createErrorResponse(500, 'Internal server error'));
  }
};
