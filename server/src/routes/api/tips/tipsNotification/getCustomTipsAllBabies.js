// server/src/routes/api/tips/[tipsNotification]/getCustomTipsAllBabies.js
// Route for GET /tips/notification  -Get tips related to babies

// GET TIPS NOTIFICATION SETTINGS + CUSTOM TIPS FOR RELATED BABIES
// 1- GET USER_ID, AND BABY_PROFILES OF THAT USER
// 2- CHECK NOTIFICATION SETTINGS SAVED IN TipsNotificationSettings TABLE
// 	+ IF there is NO tipsnotificationsettings RECORD, CREATE A NEW RECORD FOR tipsnotificationsettings with dedault settings of DAILY + OPTED-IN
// 	+ If there is already  tipsnotificationsettings RECORD, get and load

// 3- for each baby, SAVE THE GENDER AND calculate "Baby Age (in months)" based on birthdate to today

// 4- FILTER THE CuratedTips TABLE TO GET THE RELATED TIPS
// 5- SEND: TIPS NOTIFICATION SETTINGS + CUSTOM TIPS FOR RELATED BABIES

const logger = require('../../../../utils/logger');
const { createSuccessResponse, createErrorResponse } = require('../../../../utils/response');
const pool = require('../../../../../database/db');
const { getUserId } = require('../../../../utils/userIdHelper');

// Helper to calculate age in months from a birthdate to today
function calculateAgeInMonths(birthdate) {
  const birth = new Date(birthdate);
  const now = new Date();
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (now.getDate() < birth.getDate()) months--;
  return months;
}

module.exports = async (req, res) => {
    try {
        // Step 1a: Verify the user token and get user_id
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res
                .status(401)
                .json(createErrorResponse(401, "No authorization token provided"));
        }

        const user_id = await getUserId(authHeader);
        if (!user_id) {
            return res.status(401).json(createErrorResponse(401, "Invalid user ID"));
        }
        logger.debug(user_id, `user_id from token`);
     
        // Step 1b: Fetch baby profiles for this user
        const babyProfilesResult = await pool.query(
            `SELECT b.*
            FROM baby b
            JOIN user_baby ub ON b.baby_id = ub.baby_id
            JOIN users u ON u.user_id = ub.user_id
            WHERE u.user_id = $1
            ORDER BY b.baby_id ASC`,
            [parseInt(user_id, 10)]
        );  // get all babies for this user
        const babies = babyProfilesResult.rows;
        logger.debug(babies, `babies for user_id ${user_id}`);

        if (babies.length === 0) {
            return res
                .status(404)
                .json(createErrorResponse(404, "No baby profiles found for this user"));
        }

        // ----TABLE TipsNotificationSettings----
        // Step 2: GET saved setting from existing TipsNotificationSettings record
        let settingsResult = await pool.query(
            `SELECT * FROM TipsNotificationSettings WHERE user_id = $1`,
            [user_id]
        );

        let notificationSettings;
        if (settingsResult.rows.length === 0) {
            // If no record found, create a new record with default settings: Daily, Opted-in
            const insertResult = await pool.query(
                `INSERT INTO TipsNotificationSettings (user_id, notification_frequency, opt_in)
                VALUES ($1, 'Daily', true)
                RETURNING *`,
                [user_id]
            );
            logger.debug(insertResult.rows[0], `New notification settings created for user_id ${user_id}`);

            notificationSettings = insertResult.rows[0];

        } else {    // If record found, load the settings
            notificationSettings = settingsResult.rows[0];
        }
        logger.debug(notificationSettings, `notificationSettings for user_id ${user_id}`);

        // ----TABLE CuratedTips----
        // Step 3 & 4: For each baby, calculate age (in months) and filter CuratedTips
        let babiesTips = [];
        for (const baby of babies) {
            if (!baby.birthdate) {
                let ageInMonths = null;
            } else {
                let ageInMonths = calculateAgeInMonths(baby.birthdate);
            }

            const babyGender = baby.gender; // "Boy" or "Girl"
      
            // Filter CuratedTips based on baby's age and gender
            const tipsResult = await pool.query(
                `SELECT * FROM CuratedTips
         WHERE $1 BETWEEN min_age AND max_age
           AND (target_gender = $2 OR target_gender = 'All')
           AND notification_frequency = $3`,
                [ageInMonths, babyGender, notificationSettings.notification_frequency]
            );

            // add each tip to the array babiesTips
            const babyTips = tipsResult.rows;
            // add only the tips to the array babiesTips
            babiesTips = babiesTips.concat(babyTips);
            
            logger.info(babyTips, `babyTips for baby_id ${baby.baby_id}`);
        }

        logger.info(babiesTips, `All related tips for user_id ${user_id}'s babies}`);

        // Step 5: Send the notification settings and related tips
        return res.status(200).json({
            notificationSettings,
            babiesTips,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json(createErrorResponse(500, "Server Error"));
    }
};







// // GET /tips  - Get all tips
// module.exports = async (req, res) => {
//   try {
//     const result = await pool.query('SELECT * FROM CuratedTips');

//     if (result.rows.length > 0) {
//       res.status(200).send(createSuccessResponse({ data: result.rows })); // 200 OK with MULTIPLE records
//     } else {
//       res.status(404).send(createErrorResponse(404, `Not found curated tips`)); // 404 Not Found
//     }
//   } catch (err) {
//     logger.error(err, `ERROR in GET /tips, Error fetching curated tips`);

//     res.status(500).send(createErrorResponse(500, `Internal server error`)); // 500 Internal Server Error
//   }
// };
