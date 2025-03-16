// server/src/routes/api/export/[getExportCSV].js
// Route: GET /export/csv

// GETTING RELATED DATA FROM DATABASE
// Step1: VERIFY THE USER + FIND RELATED BABY_ID
// Step2: FOR EACH BABY_ID, GET THE RELATED DATA: BABY_INFO, GROWTH_RECORDS, MILESTONES, FEEDING_SCHEDULE
//    - BABY_INFO: baby_name, baby_dob
// Step3: EXPORT THE DATA AS CSV

const logger = require('../../../utils/logger');
const { createSuccessResponse, createErrorResponse } = require('../../../utils/response');
const pool = require('../../../../database/db');
const { getUserId } = require('../../../utils/userIdHelper');

// GET /export/csv
// req.headers.authorization: is JWT token
// req.query.startDate + endDate: are date range
module.exports = async (req, res) => {
  try {
    // Step1: Verify the user token- get related baby_id
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res
        .status(401)
        .json(createErrorResponse(401, "No authorization token provided"));
    } // 401 UNAUTHORIZED
    logger.debug(authHeader, `Authorization header: `);


    const user_id = await getUserId(authHeader);
    if (!user_id) {
      return res.status(401).json(createErrorResponse(401, "Invalid user ID"));
    } // 401 UNAUTHORIZED
    logger.debug(user_id, `User ID is: `);

    // Extract DATE RANGE
    const { startDate: startDateParam, endDate: endDateParam } = req.query;

    // if no date range:
    // startDate = date of useraccount creation (in format: YYYY-MM-DD)
    // endDate = today
    if (!startDateParam) {
      startDateParam = await pool.query(
        `SELECT created_at FROM users WHERE user_id = $1`,
        [parseInt(user_id, 10)]
      );
    }

    if (!endDateParam) {
      endDateParam = new Date().toISOString().split("T")[0];
    }
    logger.debug(startDateParam, `Start Date: `);
    logger.debug(endDateParam, `End Date: `);


    // Query to fetch baby profiles for this user
    const babyProfilesResult = await pool.query(
      `SELECT b.* FROM baby b
       JOIN user_baby ub ON b.baby_id = ub.baby_id
       JOIN users u ON u.user_id = ub.user_id
       WHERE u.user_id = $1
       ORDER BY b.baby_id ASC`,
      [parseInt(user_id, 10)]
    );
    const babies = babyProfilesResult.rows;
    if (babies.length === 0) {
      return res
        .status(404)
        .json(createErrorResponse(404, "No baby profiles found for this user"));
    }
    logger.debug(babies, `Baby profiles: `);


    // Step2: For each baby, query related data and append CSV sections : baby_info, growth_records, milestones, feeding_schedule
    let csvContent = "";
    for (let baby of babies) {
      // --- Baby Information Section ---
      csvContent += `Baby: ${baby.first_name} ${baby.last_name}, DOB: ${baby.baby_dob || "N/A"}\n`;
      csvContent += "Baby Information\n";
      csvContent += "ID,First Name,Last Name,DOB,Gender,Weight,Created At\n";
      csvContent += `${baby.baby_id},${baby.first_name},${baby.last_name},${baby.baby_dob || "N/A"},${baby.gender},${baby.weight},${baby.created_at}\n\n`;

      // --- Growth Records Section ---
      const growthResult = await pool.query(
        "SELECT * FROM growth WHERE baby_id = $1 AND date BETWEEN $2 AND $3 ORDER BY date ASC",
        [baby.baby_id, startDateParam, endDateParam]
      );
      logger.debug(growthResult, `Growth records of baby ${baby.baby_id}: `);

      csvContent += "Growth Records\n";
      csvContent += "Growth ID,Date,Weight,Height,Notes\n";
      if (growthResult.rows.length > 0) {
        growthResult.rows.forEach(record => {
          csvContent += `${record.growth_id},${record.date},${record.weight},${record.height},${record.notes || ""}\n`;
        });
      } else {
        csvContent += "No growth records found\n";
      }
      csvContent += "\n";


      // --- Milestones Section ---
      const milestonesResult = await pool.query(
        "SELECT * FROM milestones WHERE baby_id = $1 AND date BETWEEN $2 AND $3 ORDER BY date ASC",
        [baby.baby_id, startDateParam, endDateParam]
      );
      logger.debug(milestonesResult, `Milestones of baby ${baby.baby_id}: `);

      csvContent += "Milestones\n";
      csvContent += "Milestone ID,Date,Title,Details\n";
      if (milestonesResult.rows.length > 0) {
        milestonesResult.rows.forEach(milestone => {
          csvContent += `${milestone.milestone_id},${milestone.date},${milestone.title},${milestone.details || ""}\n`;
        });
      } else {
        csvContent += "No milestones found\n";
      }
      csvContent += "\n";


      // --- Feeding Schedule Section ---
      const feedingResult = await pool.query(
        "SELECT * FROM feedingschedule WHERE baby_id = $1 AND date BETWEEN $2 AND $3 ORDER BY date ASC, time ASC",
        [baby.baby_id, startDateParam, endDateParam]
      );
      logger.debug(feedingResult, `Feeding schedule of baby ${baby.baby_id}: `);

      csvContent += "Feeding Schedule\n";
      csvContent += "Schedule ID,Date,Time,Meal,Amount,Type,Issues,Notes\n";
      if (feedingResult.rows.length > 0) {
        feedingResult.rows.forEach(feed => {
          csvContent += `${feed.feeding_schedule_id},${feed.date},${feed.time},${feed.meal},${feed.amount},${feed.type},${feed.issues || ""},${feed.notes || ""}\n`;
        });
      } else {
        csvContent += "No feeding schedule records found\n";
      }
      csvContent += "\n\n";
    }

    // Set headers for CSV download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=ExportedBabyData.csv");
    res.send(csvContent);
  } catch (err) {
    logger.error(err, `ERROR in getExportCSV(), Error exporting data: `);
    return res.status(500).json(createErrorResponse(500, "Internal server error"));
  }
};
