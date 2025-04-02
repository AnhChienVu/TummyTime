// src/routes/api/milestones/getAllMilestones.js
const pool = require('../../../../database/db');
const logger = require('../../../utils/logger');
const { getUserId } = require('../../../utils/userIdHelper');
const pool = require('../../../../database/db');
const logger = require('../../../utils/logger');
const { getUserId } = require('../../../utils/userIdHelper');

// First, get the user ID from the authorization header
// GET /v1/milestones
// Get all milestones for the current user
module.exports = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        status: 'error',
        error: {
          code: 401,
          message: 'No authorization token provided',
        },
      });
    }

    const userId = await getUserId(authHeader);
    if (!userId) {
      return res.status(404).json({
        status: 'error',
        error: {
          code: 404,
          message: 'User not found',
        },
      });
    }

    // Check if we want today's milestones only
    const todayOnly = req.query.today === 'true';

    let query = `
      SELECT m.*, b.first_name, b.last_name 
      FROM milestones m
      LEFT JOIN user_baby ub ON m.baby_id = ub.baby_id
      LEFT JOIN baby b ON m.baby_id = b.baby_id
      WHERE ub.user_id = $1
    `;

    const queryParams = [userId];

    if (todayOnly) {
      query += ` AND DATE(m.date) = CURRENT_DATE`;
    }

    query += ` ORDER BY m.baby_id ASC`;

    const milestones = await pool.query(query, queryParams);
    // Get all milestones for babies that belong to the user
    const milestones = await pool.query(
      `SELECT 
         m.milestone_id,
         m.baby_id,
         TO_CHAR(m.date, 'YYYY-MM-DD') AS date, -- Format the date as YYYY-MM-DD
         m.title,
         m.details,
         b.first_name,
         b.last_name 
       FROM milestones m
       LEFT JOIN user_baby ub ON m.baby_id = ub.baby_id
       LEFT JOIN baby b ON m.baby_id = b.baby_id
       WHERE ub.user_id = $1
       ORDER BY m.baby_id ASC`,
      [userId]
    );

    const formattedMilestones = milestones.rows.map((milestone) => ({
      ...milestone,
      first_name: milestone.first_name || 'Unknown',
      last_name: milestone.last_name || '',
      first_name: milestone.first_name || 'Unknown',
      last_name: milestone.last_name || '',
    }));

    return res.json({
      status: 'ok',
      status: 'ok',
      data: formattedMilestones,
    });
  } catch (error) {
    logger.error(`Error getting milestones: ${error.message}`);
    return res.status(500).json({
      status: 'error',
      status: 'error',
      error: {
        code: 500,
        message: 'Internal server error',
        message: 'Internal server error',
      },
    });
  }
};
