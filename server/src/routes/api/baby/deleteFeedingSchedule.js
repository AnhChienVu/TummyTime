// src/routes/api/baby/deleteFeedingSchedule.js
const pool = require("../../../../database/db");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("../../../utils/response");

module.exports = async (req, res) => {
  const { mealId } = req.params;

  try {
    const deletedFeedingSchedules = await pool.query(
      "DELETE FROM feedingschedule WHERE feeding_schedule_id = $1 RETURNING *",
      [mealId]
    );
    console.log("Deleted feeding schedules: ", deletedFeedingSchedules);
    return res.json(createSuccessResponse(deletedFeedingSchedules.rows));
  } catch (error) {
    console.error("Database query error:", error);
    return res
      .status(500)
      .json(createErrorResponse(500, "Internal server error"));
  }
};
