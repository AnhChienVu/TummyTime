// server/src/routes/api/quiz/getAllQuizzes.js
// Route for GET /quiz

// NOTE-: =>[NO AUTHENTICATION] REQUIRED FOR THIS ROUTE (everyone can access)

const logger = require('../../../utils/logger');
const { createSuccessResponse, createErrorResponse } = require('../../../utils/response');
const pool = require('../../../../database/db');

// GET /quiz
// {req} has [req.query.category] : for quiz category
// ==>{res} as json { data: [...] }
module.exports = async (req, res) => {
  try {
    const { category } = req.query;
    if (!category) {
      category = 'ALL';
    }

    const categoryFilter = category === 'ALL' ? '' : `WHERE category = $1`;

    // Select 5 random questions for the chosen category
    const result = await pool.query(
      `SELECT question_id, category, question_text, option_a, option_b, option_c, option_d 
      FROM QuizQuestions
      ${categoryFilter}
      ORDER BY random()
      LIMIT 5`,
     [category]
   );

    if (result.rows.length > 0) {
      // return ALL ROWS
      res.status(200).send(createSuccessResponse({ data: result.rows }));
    } else {
      res.status(404).send(createErrorResponse(404, 'No quiz found'));
    }
  } catch (err) {
    logger.error(err, `ERROR in getAllQuizzes(), Error fetching all quizzes: `);
    res.status(500).json(createErrorResponse(500, 'Internal server error'));
  }
};
