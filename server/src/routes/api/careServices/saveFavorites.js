// server/src/routes/api/careServices/favorites.js
const logger = require('../../../utils/logger');
const { createSuccessResponse, createErrorResponse } = require('../../../utils/response');
const pool = require('../../../../database/db');
const jwt = require('jsonwebtoken');

/**
 * GET /api/careServices/favorites - Get user's favorite providers
 */
const getFavorites = async (req, res) => {
  try {
    // 1) Decode or verify the token to get user info
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.email) {
      // Even for invalid tokens, return empty array with 200 status
      logger.warn('Invalid token format - returning empty favorites');
      return res.status(200).json(createSuccessResponse({ favorites: [] }));
    }

    // 2) Get user ID from email
    const userResult = await pool.query('SELECT user_id FROM users WHERE email = $1', [
      decoded.email,
    ]);
    if (userResult.rows.length === 0) {
      // If user not found, return empty array with 200 status
      logger.warn(`User not found for email=${decoded.email} - returning empty favorites`);
      return res.status(200).json(createSuccessResponse({ favorites: [] }));
    }
    const userId = userResult.rows[0].user_id;

    // 3) Check if table exists
    try {
      // First check if the user_favorite_providers table exists
      const tableCheckResult = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = 'user_favorite_providers'
        );
      `);

      const tableExists = tableCheckResult.rows[0].exists;

      if (!tableExists) {
        // Table doesn't exist, return empty array
        logger.warn('user_favorite_providers table does not exist - returning empty favorites');
        return res.status(200).json(createSuccessResponse({ favorites: [] }));
      }

      // 4) Query user's favorite providers
      const result = await pool.query(`
        SELECT provider_id FROM user_favorite_providers
        WHERE user_id = $1
      `, [userId]);

      // 5) Return list of favorite provider IDs - empty array if none found
      const favoriteIds = result.rows.map(row => row.provider_id);
      return res.status(200).json(createSuccessResponse({ favorites: favoriteIds }));
    } catch (dbError) {
      // Log the database error but return an empty array with 200 status
      logger.error(dbError, 'Database error when querying favorites - returning empty list');
      return res.status(200).json(createSuccessResponse({ favorites: [] }));
    }
  } catch (error) {
    // Catch all errors and still return a 200 with empty favorites
    logger.error(error, 'ERROR in GET /careServices/favorites');
    return res.status(200).json(createSuccessResponse({ favorites: [] }));
  }
};

/**
 * POST /api/careServices/favorites - Toggle a provider's favorite status
 */
const toggleFavorite = async (req, res) => {
  try {
    // 1) Validate request body
    const { providerId, isFavorite } = req.body;
    if (!providerId) {
      return res.status(400).json(createErrorResponse(400, 'Provider ID is required'));
    }

    // 2) Decode or verify the token to get user info
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.email) {
      return res.status(401).json(createErrorResponse(401, 'Invalid token format'));
    }

    // 3) Get user ID from email
    const userResult = await pool.query('SELECT user_id FROM users WHERE email = $1', [
      decoded.email,
    ]);
    if (userResult.rows.length === 0) {
      return res.status(404).json(createErrorResponse(404, 'User not found'));
    }
    const userId = userResult.rows[0].user_id;

    // 4) Check if provider exists
    const providerResult = await pool.query('SELECT id FROM childcare_providers WHERE id = $1', [providerId]);
    if (providerResult.rows.length === 0) {
      return res.status(404).json(createErrorResponse(404, 'Provider not found'));
    }

    // 5) Add or remove from favorites based on isFavorite flag
    if (isFavorite) {
      // Check if already a favorite to avoid duplicates
      const existingResult = await pool.query(`
        SELECT * FROM user_favorite_providers
        WHERE user_id = $1 AND provider_id = $2
      `, [userId, providerId]);

      if (existingResult.rows.length === 0) {
        // Add to favorites
        await pool.query(`
          INSERT INTO user_favorite_providers (user_id, provider_id)
          VALUES ($1, $2)
        `, [userId, providerId]);
      }
    } else {
      // Remove from favorites
      await pool.query(`
        DELETE FROM user_favorite_providers
        WHERE user_id = $1 AND provider_id = $2
      `, [userId, providerId]);
    }

    return res.status(200).json(createSuccessResponse({
      message: isFavorite ? 'Provider added to favorites' : 'Provider removed from favorites'
    }));
  } catch (error) {
    logger.error(error, 'ERROR in POST /careServices/favorites');
    return res.status(500).json(createErrorResponse(500, 'Internal server error'));
  }
};

module.exports = {
  getFavorites,
  toggleFavorite
};
