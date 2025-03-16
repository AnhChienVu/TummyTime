// server/src/routes/api/export/[getExportCSV].js
// Route: GET /export/csv

// GETTING RELATED DATA FROM DATABASE
// Step1: VERIFY THE USER + FIND RELATED BABY_ID
// Step2: FOR EACH BABY_ID, GET THE RELATED DATA: BABY_INFO, GROWTH_RECORDS, MILESTONES, FEEDING_SCHEDULE, STOOL_RECORDS
// Step3: EXPORT THE DATA AS CSV

const logger = require('../../../utils/logger');
const { createSuccessResponse, createErrorResponse } = require('../../../utils/response');
const pool = require('../../../../database/db');
const { getUserId } = require('../../../utils/userIdHelper');

// GET /export/csv
// req.headers.authorization: is JWT token
// req.query.startDate + endDate: are date range
// req.query include options for each category (babyInfo, growth,...)
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

    // Extract DATE RANGE and selected categories
    let { startDate, endDate, babyInfo, growthRecords, milestones, feedingSchedule, stoolRecords } = req.query;


    // if no date range:
    // startDate = date of useraccount creation (in format: YYYY-MM-DD)
    // endDate = today
    // If startDate not provided, set it to the user's creation date (formatted as YYYY-MM-DD)
    if (!startDate) {
      const userResult = await pool.query(
        `SELECT to_char(created_at, 'YYYY-MM-DD') as created_at FROM users WHERE user_id = $1`,
        [parseInt(user_id, 10)]
      );

      if (userResult.rows.length === 0) {
        throw new Error("User not found");
      } else {
        startDate = userResult.rows[0].created_at;
      }
    }

    if (!endDate) {
      endDate = new Date().toISOString().split("T")[0];
    }
    logger.debug(startDate, `Start Date: `);
    logger.debug(endDate, `End Date: `);

    babyInfo = babyInfo === undefined ? "true" : babyInfo;
    growthRecords = growthRecords === undefined ? "true" : growthRecords;
    milestones = milestones === undefined ? "true" : milestones;
    feedingSchedule = feedingSchedule === undefined ? "true" : feedingSchedule;
    stoolRecords = stoolRecords === undefined ? "true" : stoolRecords;

    const includeBabyInfo = babyInfo === "true";
    const includeGrowthRecords = growthRecords === "true";
    const includeMilestones = milestones === "true";
    const includeFeedingSchedule = feedingSchedule === "true";
    const includeStoolRecords = stoolRecords === "true";
  
    logger.debug(includeBabyInfo, `Include Baby Info: `);
    logger.debug(includeGrowthRecords, `Include Growth Records: `);
    logger.debug(includeMilestones, `Include Milestones: `);
    logger.debug(includeFeedingSchedule, `Include Feeding Schedule: `);
    logger.debug(includeStoolRecords, `Include Stool Records: `);

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


    // Step2: For each baby, query related data and append CSV sections : baby_info, growth_records, milestones, feeding_schedule, stool_records
    
    // Build CSV content
    let csvContent = "";

    for (let baby of babies) {
      // Baby header
      csvContent += `Baby: ${baby.first_name} ${baby.last_name}, DOB: ${baby.birthdate || "N/A"}\n`;

      // --- Baby Information ---
      if (includeBabyInfo) {
        csvContent += "Baby Information\n";
        csvContent += "ID,First Name,Last Name,DOB,Gender,Weight,Created At\n";
        csvContent += `${baby.baby_id},${baby.first_name},${baby.last_name},${baby.birthdate || "N/A"},${baby.gender},${baby.weight},${baby.created_at}\n\n`;
      }

      // --- Growth Records Section ---
      if (includeGrowthRecords) {
        const growthResult = await pool.query(
          "SELECT * FROM growth WHERE baby_id = $1 AND date BETWEEN $2 AND $3 ORDER BY date ASC",
          [baby.baby_id, startDate, endDate]
        );

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
      }

      // --- Milestones Section ---
      if (includeMilestones) {
        const milestonesResult = await pool.query(
          "SELECT * FROM milestones WHERE baby_id = $1 AND date BETWEEN $2 AND $3 ORDER BY date ASC",
          [baby.baby_id, startDate, endDate]
        );
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
      }

      // --- Feeding Schedule Section ---
      if (includeFeedingSchedule) {
        const feedingResult = await pool.query(
          "SELECT * FROM feedingschedule WHERE baby_id = $1 AND date BETWEEN $2 AND $3 ORDER BY date ASC, time ASC",
          [baby.baby_id, startDate, endDate]
        );
        csvContent += "Feeding Schedule\n";
        csvContent += "Schedule ID,Date,Time,Meal,Amount,Type,Issues,Notes\n";
        if (feedingResult.rows.length > 0) {
          feedingResult.rows.forEach(feed => {
            csvContent += `${feed.feeding_schedule_id},${feed.date},${feed.time},${feed.meal},${feed.amount},${feed.type},${feed.issues || ""},${feed.notes || ""}\n`;
          });
        } else {
          csvContent += "No feeding schedule records found\n";
        }
        csvContent += "\n";
      }

      // --- Stool Records Section ---
      if (includeStoolRecords) {
        const stoolResult = await pool.query(
          "SELECT * FROM stool_entries WHERE baby_id = $1 AND date(timestamp) BETWEEN $2 AND $3 ORDER BY timestamp DESC",
          [baby.baby_id, startDate, endDate]
        );
        csvContent += "Stool Records\n";
        csvContent += "Stool ID,Timestamp,Color,Consistency,Notes\n";
        if (stoolResult.rows.length > 0) {
          stoolResult.rows.forEach(entry => {
            csvContent += `${entry.stool_id},${entry.timestamp},${entry.color},${entry.consistency},${entry.notes || ""}\n`;
          });
        } else {
          csvContent += "No stool records found\n";
        }
        csvContent += "\n";
      }

      // Separate each baby
      csvContent += "\n\n";
    }

    // Build file name based on included sections and date range
    let fileNameParts = ["ExportedBabyData"];
    if (includeBabyInfo) fileNameParts.push("Info");
    if (includeGrowthRecords) fileNameParts.push("Growth");
    if (includeMilestones) fileNameParts.push("Milestones");
    if (includeFeedingSchedule) fileNameParts.push("Feeding");
    if (includeStoolRecords) fileNameParts.push("Stool");
    fileNameParts.push(`from${startDate}`);
    fileNameParts.push(`to${endDate}`);
    const fileName = fileNameParts.join("_") + ".csv";

    // Insert export record into exporteddocument table
    const exportDate = new Date().toISOString(); 
    const insertResult = await pool.query(
      "INSERT INTO exporteddocument (file_name, file_format, created_at) VALUES ($1, $2, $3) RETURNING *",
      [fileName, "CSV", exportDate]
    );
    logger.info(`Export record created: ${JSON.stringify(insertResult.rows[0])}`);

    // Set headers to expose our custom headers (without using middleware).
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition, exportfilename");
    

    // Set headers to trigger CSV download with the dynamic file name
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
    // add a header for filename
    res.setHeader("exportfilename", fileName);
    res.send(csvContent);
  } catch (err) {
    logger.error(err, "ERROR in getExportCSV(), Error exporting data: ");
    return res.status(500).json(createErrorResponse(500, "Internal server error"));
  }
};