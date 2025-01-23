// src/routes/api/addBaby.js
const pool = require("../../../database/db");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("../../utils/response");

module.exports = async (req, res) => {
  const { first_name, last_name, gender, weight } = req.body;

  try {
    const newBaby = await pool.query(
      "INSERT INTO Baby (first_name, last_name, gender, weight) VALUES ($1, $2, $3, $4) RETURNING *",
      [first_name, last_name, gender, weight]
    );

    return res.json(createSuccessResponse(newBaby.rows[0]));
  } catch (error) {
    console.error("Database query error:", error);
    return res
      .status(500)
      .json(createErrorResponse(500, "Internal server error"));
  }
};
