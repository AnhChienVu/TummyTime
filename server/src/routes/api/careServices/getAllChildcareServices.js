// server/src/routes/api/careServices/index.js
const logger = require('../../../utils/logger');
const { createSuccessResponse, createErrorResponse } = require('../../../utils/response');
const pool = require('../../../../database/db');
const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
  try {
    // 1) Check authorization header
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

    // 2) Decode or verify the token
    // For stronger security, replace jwt.decode(...) with jwt.verify(...).
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.email) {
      logger.warn('No email found in token payload', { decoded });
      return res.status(401).json(createErrorResponse(401, 'Invalid token format'));
    }

    // 3) Lookup user if needed
    const userResult = await pool.query('SELECT user_id FROM users WHERE email = $1', [
      decoded.email,
    ]);
    if (userResult.rows.length === 0) {
      logger.warn(`User not found in DB for email=${decoded.email}`);
      return res.status(404).json(createErrorResponse(404, 'User not found'));
    }

    // 4) Query childcare_providers with DISTINCT ON
    //    This ensures only one row per unique (name, rating, hourly_rate, experience, title, bio).
    //    The ORDER BY includes the DISTINCT ON columns + an extra column (e.g. id) to pick which row to keep.
    const result = await pool.query(`
      SELECT DISTINCT ON (name, rating, hourly_rate, experience, title, bio)
             id,
             provider_type,
             city,
             name,
             location,
             rating,
             reviews_count,
             experience,
             age,
             hourly_rate,
             title,
             bio,
             is_premium,
             profile_url,
             profile_image,
             verification,
             hired_count
      FROM childcare_providers
      ORDER BY name, rating, hourly_rate, experience, title, bio, id
    `);

    // 5) Return the distinct rows
    return res.status(200).json(createSuccessResponse({ providers: result.rows }));
  } catch (error) {
    logger.error(error, 'ERROR in GET /careServices');
    return res.status(500).json(createErrorResponse(500, 'Internal server error'));
  }
};
