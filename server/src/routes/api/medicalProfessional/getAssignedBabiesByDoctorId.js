// src/routes/api/medicalProfessional/getAssignedBabiesByDoctorId.js

const logger = require('../../../utils/logger');
const {
  createSuccessResponse,
  createErrorResponse,
} = require('../../../utils/response');
const pool = require('../../../../database/db');

module.exports.getAssignedBabiesByDoctorId = async function (req, res) {
  try {
    const doctorId = req.params.doctor_id;
    const query = `SELECT * FROM doctor_baby WHERE doctor_id = $1`;
    const result = await pool.query(query, [doctorId]);
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json(createErrorResponse('No assigned babies found for this doctor'));
    }
    const babyIds = result.rows.map((row) => row.baby_id);
    const babyInfos = await pool.query(
      `SELECT * FROM baby WHERE baby_id = ANY($1::int[])`,
      [babyIds]
    );
    console.log('Hi', babyInfos);
    return res.status(200).json(
      createSuccessResponse({
        babies: babyInfos.rows,
      })
    );
  } catch (error) {
    logger.error(error);
    return res
      .status(500)
      .json(createErrorResponse('Error fetching assigned babies'));
  }
};
