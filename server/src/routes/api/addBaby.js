// src/routes/api/addBaby.js
const pool = require("../../../database/db");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("../../utils/response");

module.exports = async (req, res) => {
  const userId = req.params.user_id;
  const { first_name, last_name, gender, weight } = req.body;
  console.log("req.params", req.params);
  console.log("req.user", req.user);

  try {
    const newBaby = await pool.query(
      "INSERT INTO Baby (first_name, last_name, gender, weight) VALUES ($1, $2, $3, $4) RETURNING *",
      [first_name, last_name, gender, weight]
    );

    await pool.query(
      "INSERT INTO user_baby (user_id, baby_id) VALUES ($1, $2)",
      [userId, newBaby.rows[0].baby_id]
    );

    return res.json(createSuccessResponse(newBaby.rows[0]));
  } catch (error) {
    console.error("Database query error:", error);
    return res
      .status(500)
      .json(createErrorResponse(500, "Internal server error"));
  }
};
