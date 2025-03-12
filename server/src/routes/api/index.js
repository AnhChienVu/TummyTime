// src/routes/api/index.js
// Our authentication middleware
const { authenticate } = require('../../auth');
/**
 * The main entry-point for the v1 version of the API.
 */
const express = require('express');

// Create a router on which to mount our API endpoints
const router = express.Router();

// Import all of stool API endpoints
const { getStoolEntries } = require('./baby/stool/getStool');
const { createStoolEntry } = require('./baby/stool/postStool');
const { updateStoolEntry } = require('./baby/stool/putStool');
const { deleteStoolEntry } = require('./baby/stool/deleteStool');

router.post('/login', require('./login'));

router.post('/signup', require('./signup'));

// ************ /feedingSchedule routes ************
router.get(
  '/baby/:id/getFeedingSchedules',
  authenticate(),
  require('./baby/getFeedingSchedules')
);

router.put(
  '/baby/:id/updateFeedingSchedule/:mealId',
  authenticate(),
  require('./baby/updateFeedingSchedule')
);

router.delete(
  '/baby/:id/deleteFeedingSchedule/:mealId',
  authenticate(),
  require('./baby/deleteFeedingSchedule')
);

router.post(
  '/baby/:id/addFeedingSchedule',
  authenticate(),
  require('./baby/addFeedingSchedule')
);

router.get(
  '/user/:id/getBabyProfiles',
  authenticate(),
  require('./baby/babyProfile/getBabyProfile')
);

//************ /user routes ************
router.get('/user/me', authenticate(), require('./user/me').getUserDetails);

router.get('/user', authenticate(), require('./user/getUser').getUserById);

router.put(
  '/user/:id',
  authenticate(),
  require('./user/putUser').updateUserById
);

router.delete(
  '/user/:id',
  authenticate(),
  require('./user/deleteUser').deleteUserById
);

// ************ /growth routes ************
router.get(
  '/baby/:babyId/growth/',
  authenticate(),
  require('./growth/getGrowth').getAllGrowth
); // Get all Growth records by [:babyId]

router.post(
  '/baby/:babyId/growth',
  authenticate(),
  require('./growth/postGrowth').createGrowth
);

router.put(
  '/baby/:babyId/growth/:growthId',
  authenticate(),
  require('./growth/putGrowth').updateGrowthById
);

router.delete(
  '/baby/:babyId/growth/:growthId',
  authenticate(),
  require('./growth/deleteGrowth').deleteGrowthById
);

// ************ /milestones routes ************
router.get(
  "/milestones",
  authenticate(),
  require("./milestones/getAllMilestones")
);

router.get(
  "/baby/:baby_id/milestones",
  authenticate(),
  require('./milestones/getMilestones').getMilestoneByBabyId
);

router.post(
  "/baby/:baby_id/milestones",
  authenticate(),
  require('./milestones/postMilestone').createMilestone
);

router.put(
  "/baby/:baby_id/milestones/:milestone_id",
  authenticate(),
  require('./milestones/putMilestone').updateMilestoneById
);

router.delete(
  "/baby/:baby_id/milestones/:milestone_id",
  authenticate(),
  require('./milestones/deleteMilestone').deleteMilestoneById
);

// ************ /babyProfile routes ************
router.post(
  '/baby',
  authenticate(),
  require('./baby/babyProfile/addBabyProfile')
);

router.get(
  '/babies',
  authenticate(),
  require('./baby/babyProfile/getAllBabyProfiles')
);

router.get(
  '/baby/:baby_id',
  authenticate(),
  require('./baby/babyProfile/getBabyProfile')
);

router.put(
  '/baby/:baby_id',
  authenticate(),
  require('./baby/babyProfile/putBabyProfile')
);

router.delete(
  '/baby/:baby_id',
  authenticate(),
  require('./baby/babyProfile/deleteBabyProfile')
);

// ************ /journal routes ************
router.post('/journal', authenticate(), require('./journal/addJournalEntry'));

router.get('/journal', authenticate(), require('./journal/getJournalEntries'));

router.get(
  '/journal/:id',
  authenticate(),
  require('./journal/getJournalEntry')
);

router.put(
  '/journal/:id',
  authenticate(),
  require('./journal/putJournalEntry')
);

router.delete(
  '/journal/:id',
  authenticate(),
  require('./journal/deleteJournalEntry')
);

// ************ /forum routes ************
router.post(
  '/forum/posts/add',
  authenticate(),
  require('./forum/posts/addPost')
);

router.get(
  '/forum/posts/:post_id',
  authenticate(),
  require('./forum/posts/getPost')
);

router.get('/forum/posts', authenticate(), require('./forum/posts/getPosts'));

router.put(
  '/forum/posts/:post_id',
  authenticate(),
  require('./forum/posts/putPost')
);

router.delete(
  '/forum/posts/:post_id',
  authenticate(),
  require('./forum/posts/deletePost')
);

router.post(
  '/forum/posts/:post_id/reply',
  authenticate(),
  require('./forum/replies/addReply')
);

router.get(
  '/forum/posts/:post_id/replies',
  authenticate(),
  require('./forum/replies/getReplies')
);

router.put(
  '/forum/replies/:reply_id',
  authenticate(),
  require('./forum/replies/putReply')
);

router.delete(
  '/forum/replies/:reply_id',
  authenticate(),
  require('./forum/replies/deleteReply')
);

// ************ /coupons routes ************
router.get('/coupons', require('./coupons/getAllCoupons'));

// ************ /voiceCommand routes ************
router.post(
  '/voiceCommand',
  require('./voiceCommand/processVoiceCommand').processVoiceCommand
);

// ************ /tips routes ************
router.get('/tips', require('./tips/getAllTips'));

// ************ Stool routes ************
router.get('/baby/:babyId/stool', authenticate(), getStoolEntries);
router.post('/baby/:babyId/stool', authenticate(), createStoolEntry);
router.put('/baby/:babyId/stool/:stoolId', authenticate(), updateStoolEntry);
router.delete('/baby/:babyId/stool/:stoolId', authenticate(), deleteStoolEntry);

// ************ Check Products ************
router.get(
  '/products/checkProduct',
  require('./products/checkProduct').checkProduct
);

// ************ /healthRecord routes ************
router.get(
  "/doctor/:doctorId/healthRecords",
  require("./healthRecord/getAllHealthRecords").getAllHealthRecords
);

// Testing the authentication middleware
// router.get('/test', authenticate(), require('./test'));
module.exports = router;
