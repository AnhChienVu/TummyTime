// client/src/routes/api/editGrowth.js
// All /growth routes GET-PUT-DELETE-POST

const logger = require('../../../utils/logger');
const { createSuccessResponse, createErrorResponse } = require('../../../utils/response');
const pool = require('../../../../database/db');

// GET /growth/:growthId    -GET a Growth record by growthId
module.exports.getGrowthById = async (req, res) => {
  const { growthId } = req.params;

  try {
    const result = await pool.query('SELECT * FROM growth WHERE growth_id = $1', [growthId]);

    if (result.rows.length > 0) {
      res.status(200).send(createSuccessResponse(result.rows[0])); // 200 OK
    } else {
      res.status(404).send(createErrorResponse(404, `Growth record not found`)); // 404
      throw new Error(`ERROR 404 in GET /growth/:id, Growth record not found with id ${growthId}`);
    }
  } catch (err) {
    logger.error(err, `ERROR in GET /growth/:id, Error getting growth record`);

    res.status(500).send(createErrorResponse(500, `Internal server error`)); // 500 Internal Server Error
  }
};

// POST /growth     -POST a new Growth record
module.exports.createGrowth = async (req, res) => {
  const { baby_id, date, height, weight, notes } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO growth (baby_id, date, height, weight, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [baby_id, date, height, weight, notes]
    );

    res.status(201).send(createSuccessResponse(result.rows[0])); // 201 Created
  } catch (err) {
    logger.error(err, `ERROR in POST /growth, Error creating growth record`);

    res.status(500).send(createErrorResponse(500, `Internal server error`)); // 500 Internal Server Error
  }
};

// PUT /growth/:growthId    -PUT (update) a Growth record by growthId
module.exports.updateGrowthById = async (req, res) => {
  const { growthId } = req.params;
  const { date, height, weight, notes } = req.body;

  try {
    const result = await pool.query(
      'UPDATE growth SET date = $1, height = $2, weight = $3, notes = $4 WHERE growth_id = $5 RETURNING *',
      [date, height, weight, notes, growthId]
    );
    if (result.rows.length > 0) {
      res.status(200).send(createSuccessResponse(result.rows[0])); // 200 OK
    } else {
      res.status(404).send('Growth record not found'); // 404 Not Found
    }
  } catch (err) {
    logger.error(err, `ERROR in PUT /growth/:id, Error updating growth record with id ${growthId}`);

    res.status(500).send(createErrorResponse(500, `Internal server error`)); // 500 Internal Server Error
  }
};

// DELETE /growth/:growthId    -DELETE a Growth record by growthId
module.exports.deleteGrowthById = async (req, res) => {
  const { growthId } = req.params;

  try {
    const result = await pool.query('DELETE FROM growth WHERE growth_id = $1', [growthId]);

    if (result.rowCount > 0) {
      res.status(200).json(createSuccessResponse()); // 200 OK
    } else {
      res.status(404).send(createErrorResponse(404, `Growth record not found`)); // 404 Not Found
      throw new Error(
        `ERROR 404 in DELETE /growth/:id, Growth record not found with id ${growthId}`
      );
    }
  } catch (err) {
    logger.error(
      err,
      `ERROR in DELETE /growth/:id, Error deleting growth record with id ${growthId}`
    );

    res.status(500).send(createErrorResponse(500, `Internal server error`)); // 500 Internal Server Error
  }
};
