// server/src/routes/api/export/[getExportPDF].js
// Route: GET /export/pdf

// GETTING RELATED DATA FROM DATABASE
// Step1: VERIFY THE USER + FIND RELATED BABY_ID
// Step2: FOR EACH BABY_ID, GET THE RELATED DATA: BABY_INFO, GROWTH_RECORDS, MILESTONES, FEEDING_SCHEDULE, STOOL_RECORDS
// Step3: EXPORT THE DATA AS CSV
// ===> PARSE CSV-TO-HTML
// ===> CONVERT HTML-TO-PDF

const logger = require('../../../utils/logger');
const { createSuccessResponse, createErrorResponse } = require('../../../utils/response');
const pool = require('../../../../database/db');
const { getUserId } = require('../../../utils/userIdHelper');
const pdf = require('html-pdf');  // "sudo npm install -g html-pdf"

// GET /export/pdf
// req.headers.[authorization]: is JWT token
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


    // if no date range ->Set Default date range: startDate = user account creation date, endDate = today
    // (formatted as YYYY - MM - DD)
    // {Requirement} user_id: user is already exist with the token
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

    // set "undefined" to "true"
    babyInfo = babyInfo === undefined ? "true" : babyInfo;
    growthRecords = growthRecords === undefined ? "true" : growthRecords;
    milestones = milestones === undefined ? "true" : milestones;
    feedingSchedule = feedingSchedule === undefined ? "true" : feedingSchedule;
    stoolRecords = stoolRecords === undefined ? "true" : stoolRecords;
    // convert to boolean
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
    // {Requirement} baby_id: must have at least one baby
        // {checkingRequirement} check if any baby exist for this user
    const checkBabyExist = await pool.query(
      `SELECT COUNT(*) FROM user_baby WHERE user_id = $1`,
      [parseInt(user_id, 10)]
    );
    if (checkBabyExist.rows[0].count === "0") {
      return res
        .status(404)
        .json(createErrorResponse(404, "No baby profiles found for this user"));
    }
    logger.debug({checkBabyExist}, `Checking if any baby exist for this user: `);
    
    const babyProfilesResult = await pool.query(
      `SELECT b.* FROM baby b
       JOIN user_baby ub ON b.baby_id = ub.baby_id
       JOIN users u ON u.user_id = ub.user_id
       WHERE u.user_id = $1
       ORDER BY b.baby_id ASC`,
      [parseInt(user_id, 10)]
    );
    const babies = babyProfilesResult.rows;
    logger.debug(babies, `Baby profiles: `);


    // Step2: For each baby, query related data and append CSV sections : baby_info, growth_records, milestones, feeding_schedule, stool_records
    
    // Build HTML content
    let htmlContent = `
    <html>
    <head>
      <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h2 { border-bottom: 2px solid #000; padding-bottom: 5px; }
          h3 { margin-top: 30px; }

          table { border-collapse: collapse; margin-bottom: 20px; width: 100%; }
          th, td { border: 1px solid #000; padding: 8px; text-align: left; }

          .separator { margin: 30px 0; border-top: 2px dashed #666; }
      </style>
    </head>
    <body>
    `;  // STYLE for html

    // LOOP THROUGH EACH BABY
    for (let baby of babies) {
      // add [separator] between next baby
      if (htmlContent.length > 0) {
        htmlContent += "==========,==============,============,============,====================\n";
      }

      // Baby header
      htmlContent += `Baby: ${baby.first_name} ${baby.last_name}\n`;
      // htmlContent += `, DOB: ${baby.birthdate || "N/A"}`;  //TEMPORARILY REMOVED DOB
      htmlContent += `\n`;

      // --- Baby Information ---
      if (includeBabyInfo) {
        htmlContent += "Baby Information\n";
        htmlContent += "ID,First Name,Last Name,";
        // htmlContent += "DOB,";  //TEMPORARILY REMOVED DOB
        htmlContent += "Gender,Weight,Created At\n";

        htmlContent += `${baby.baby_id},${baby.first_name},${baby.last_name}`;
        //htmlContent += `,${baby.birthdate || "N/A"}`;  //TEMPORARILY REMOVED DOB
        htmlContent += `,${baby.gender},${baby.weight},${baby.created_at}`;
        htmlContent += `\n\n`;
      }

      // --- Growth Records Section ---
      if (includeGrowthRecords) {
        const growthResult = await pool.query(
          "SELECT * FROM growth WHERE baby_id = $1 AND date BETWEEN $2 AND $3 ORDER BY date ASC",
          [baby.baby_id, startDate, endDate]
        );

        htmlContent += "---------------------------,---------------------------,----------------------\n";
        htmlContent += "Growth Records\n";
        htmlContent += "Growth ID,Date,Weight,Height,Notes\n";
        if (growthResult.rows.length > 0) {
          growthResult.rows.forEach(record => {
            htmlContent += `${record.growth_id},${record.date},${record.weight},${record.height},${record.notes || ""}\n`;
          });
        } else {
          htmlContent += "No growth records found\n";
        }
        htmlContent += "\n";
      }

      // --- Milestones Section ---
      if (includeMilestones) {
        const milestonesResult = await pool.query(
          "SELECT * FROM milestones WHERE baby_id = $1 AND date BETWEEN $2 AND $3 ORDER BY date ASC",
          [baby.baby_id, startDate, endDate]
        );

        htmlContent += "---------------------------,---------------------------,----------------------\n";
        htmlContent += "Milestones\n";
        htmlContent += "Milestone ID,Date,Title,Details\n";
        if (milestonesResult.rows.length > 0) {
          milestonesResult.rows.forEach(milestone => {
            htmlContent += `${milestone.milestone_id},${milestone.date},${milestone.title},${milestone.details || ""}\n`;
          });
        } else {
          htmlContent += "No milestones found\n";
        }
        htmlContent += "\n";
      }

      // --- Feeding Schedule Section ---
      if (includeFeedingSchedule) {
        const feedingResult = await pool.query(
          "SELECT * FROM feedingschedule WHERE baby_id = $1 AND date BETWEEN $2 AND $3 ORDER BY date ASC, time ASC",
          [baby.baby_id, startDate, endDate]
        );

        htmlContent += "---------------------------,---------------------------,----------------------\n";
        htmlContent += "Feeding Schedule\n";
        htmlContent += "Schedule ID,Date,Time,Meal,Amount,Type,Issues,Notes\n";
        if (feedingResult.rows.length > 0) {
          feedingResult.rows.forEach(feed => {
            htmlContent += `${feed.feeding_schedule_id},${feed.date},${feed.time},${feed.meal},${feed.amount},${feed.type},${feed.issues || ""},${feed.notes || ""}\n`;
          });
        } else {
          htmlContent += "No feeding schedule records found\n";
        }
        htmlContent += "\n";
      }

      // --- Stool Records Section ---
      if (includeStoolRecords) {
        const stoolResult = await pool.query(
          "SELECT * FROM stool_entries WHERE baby_id = $1 AND date(timestamp) BETWEEN $2 AND $3 ORDER BY timestamp DESC",
          [baby.baby_id, startDate, endDate]
        );

        htmlContent += "---------------------------,---------------------------,----------------------\n";
        htmlContent += "Stool Records\n";
        htmlContent += "Stool ID,Timestamp,Color,Consistency,Notes\n";
        if (stoolResult.rows.length > 0) {
          stoolResult.rows.forEach(entry => {
            htmlContent += `${entry.stool_id},${entry.timestamp},${entry.color},${entry.consistency},${entry.notes || ""}\n`;
          });
        } else {
          htmlContent += "No stool records found\n";
        }
        htmlContent += "\n";
      }

      // Separate each baby
      htmlContent += "\n\n";
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
    res.send(htmlContent);
  } catch (err) {
    logger.error(err, "ERROR in getExportCSV(), Error exporting data: ");
    return res.status(500).json(createErrorResponse(500, "Internal server error"));
  }
};