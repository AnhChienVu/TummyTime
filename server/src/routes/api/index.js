// src/routes/api/index.js
// Our authentication middleware
const { authenticate } = require("../../auth");
/**
 * The main entry-point for the v1 version of the API.
 */
const express = require("express");

// Create a router on which to mount our API endpoints
const router = express.Router();

router.post("/login", require("./login"));

router.post("/signup", require("./signup"));

// ************ /feedingSchedule routes ************
router.get(
  "/baby/:id/getFeedingSchedules",
  require("./baby/getFeedingSchedules")
);

router.put(
  "/baby/:id/updateFeedingSchedule/:mealId",
  require("./baby/updateFeedingSchedule")
);

router.delete(
  "/baby/:id/deleteFeedingSchedule/:mealId",
  require("./baby/deleteFeedingSchedule")
);

router.post(
  "/baby/:id/addFeedingSchedule",
  require("./baby/addFeedingSchedule")
);

//************ /user routes ************
router.get("/user/:id", require("./user/getUser").getUserById);

router.put("/user/:id", require("./user/putUser").updateUserById);

router.delete("/user/:id", require("./user/deleteUser").deleteUserById);

// ************ /growth routes ************
router.get("/baby/:babyId/growth/", require("./growth/getGrowth").getAllGrowth); // Get all Growth records by [:babyId]

router.post(
  "/baby/:babyId/growth",
  require("./growth/postGrowth").createGrowth
);

router.put(
  "/baby/:babyId/growth/:growthId",
  require("./growth/putGrowth").updateGrowthById
);

router.delete(
  "/baby/:babyId/growth/:growthId",
  require("./growth/deleteGrowth").deleteGrowthById
);

// ************ /milestones routes ************
router.get(
  "/baby/:baby_id/getMilestones/",
  require("./milestones/getMilestones").getMilestoneByBabyId
);

router.post(
  "/baby/:baby_id/addMilestone/",
  require("./milestones/postMilestone").createMilestone
);

router.put(
  "/baby/:baby_id/updateMilestone/:milestone_id",
  require("./milestones/putMilestone").updateMilestoneById
);

router.delete(
  "/baby/:baby_id/deleteMilestone/:milestone_id",
  require("./milestones/deleteMilestone").deleteMilestoneById
);

// ************ /babyProfile routes ************
router.post("/baby/:baby_id/add", require("./baby/babyProfile/addBabyProfile"));

router.get(
  "/user/:user_id/getBabyProfiles",
  require("./baby/babyProfile/getAllBabyProfiles")
);

// GET one baby profile
router.get(
  "/baby/:baby_id/getBabyProfile",
  require("./baby/babyProfile/getBabyProfile")
);

router.put(
  "/baby/:baby_id/updateBabyProfile",
  require("./baby/babyProfile/putBabyProfile")
);

// router.delete(
//   "/baby/:baby_id/deleteBabyProfile",
//   require("./baby/babyProfile/deleteBabyProfile")
// );

// ************ /journal routes ************
router.post(
  "/user/:user_id/addJournalEntry",
  require("./journal/addJournalEntry")
);

router.get(
  "/user/:user_id/getJournalEntries",
  require("./journal/getJournalEntries")
);

// Testing the authentication middleware
// router.get('/test', authenticate(), require('./test'));
module.exports = router;
