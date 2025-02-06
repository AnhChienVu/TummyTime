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

router.post("/user/:user_id/addBaby", require("./addBaby"));

// Feeding Schedule routes
router.get(
  "/baby/:id/getFeedingSchedules",
  authenticate(),
  require("./baby/getFeedingSchedules")
);

router.put(
  "/baby/:id/updateFeedingSchedule/:mealId",
  authenticate(),
  require("./baby/updateFeedingSchedule")
);

router.delete(
  "/baby/:id/deleteFeedingSchedule/:mealId",
  authenticate(),
  require("./baby/deleteFeedingSchedule")
);

router.post(
  "/baby/:id/addFeedingSchedule",
  authenticate(),
  require("./baby/addFeedingSchedule")
);

router.get(
  "/user/:id/getBabyProfiles",
  authenticate(),
  require("./getBabyProfiles")
);

//************ /user routes ************
router.get("/user/:id", authenticate(), require("./user/getUser").getUserById);

router.put(
  "/user/:id",
  authenticate(),
  require("./user/putUser").updateUserById
);

router.delete(
  "/user/:id",
  authenticate(),
  require("./user/deleteUser").deleteUserById
);

// ************ /growth routes ************
router.get(
  "/baby/:babyId/growth/",
  authenticate(),
  require("./growth/getGrowth").getAllGrowth
); // Get all Growth records by [:babyId]

router.post(
  "/baby/:babyId/growth",
  authenticate(),
  require("./growth/postGrowth").createGrowth
);

router.put(
  "/baby/:babyId/growth/:growthId",
  authenticate(),
  require("./growth/putGrowth").updateGrowthById
);

router.delete(
  "/baby/:babyId/growth/:growthId",
  authenticate(),
  require("./growth/deleteGrowth").deleteGrowthById
);

// ************ /milestones routes ************
router.get(
  "/baby/:baby_id/getMilestones/",
  authenticate(),
  require("./milestones/getMilestones").getMilestoneByBabyId
);

router.post(
  "/baby/:baby_id/addMilestone/",
  authenticate(),
  require("./milestones/postMilestone").createMilestone
);

router.put(
  "/baby/:baby_id/updateMilestone/:milestone_id",
  authenticate(),
  require("./milestones/putMilestone").updateMilestoneById
);

router.delete(
  "/baby/:baby_id/deleteMilestone/:milestone_id",
  authenticate(),
  require("./milestones/deleteMilestone").deleteMilestoneById
);

// ************ /voiceCommand routes ************
router.post(
  "/voiceCommand",
  require("./voiceCommand/processVoiceCommand").processVoiceCommand
);

// Testing the authentication middleware
// router.get('/test', authenticate(), require('./test'));
module.exports = router;
