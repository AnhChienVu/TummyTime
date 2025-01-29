// src/routes/api/index.js
// Our authentication middleware
const { authenticate } = require('../../auth');
/**
 * The main entry-point for the v1 version of the API.
 */
const express = require('express');

// Create a router on which to mount our API endpoints
const router = express.Router();

router.post('/login', require('./login'));

router.post('/signup', require('./signup'));

router.post('/addBaby', require('./addBaby'));

router.get('/getFeedingSchedules', require('./getFeedingSchedules'));

router.post('/addSchedule', require('./addSchedule'));

// router.get("/getProfile", require("./getProfile"));

router.get('/user/:id/getBabyProfiles', require('./getBabyProfiles'));

//************ /user routes ************
router.get('/user/:id', require('./user/getUser').getUserById);

router.put('/user/:id', require('./user/putUser').updateUserById);

router.delete('/user/:id', require('./user/deleteUser').deleteUserById);

// ************ /growth routes ************
router.get('/growth/:growthId', require('./growth/getGrowth').getGrowthById);

router.post('/growth', require('./growth/postGrowth').createGrowth);

router.put('/growth/:growthId', require('./growth/putGrowth').updateGrowthById);

router.delete('/growth/:growthId', require('./growth/deleteGrowth').deleteGrowthById);

// ************ /milestones routes ************
router.get('/milestones/:milestoneId', require('./milestones/getMilestone').getMilestoneById);

router.post('/milestones', require('./milestones/postMilestone').createMilestone);

router.put('/milestones/:milestoneId', require('./milestones/putMilestone').updateMilestoneById);

router.delete(
  '/milestones/:milestoneId',
    require('./milestones/deleteMilestone').deleteMilestoneById
);

// ************ /growth routes ************
router.get('/growth/:growthId', require('./growth/getGrowth').getGrowthById);

router.post('/growth', require('./growth/postGrowth').createGrowth);

router.put('/growth/:growthId', require('./growth/putGrowth').updateGrowthById);

router.delete('/growth/:growthId', require('./growth/deleteGrowth').deleteGrowthById);

// Testing the authentication middleware
// router.get('/test', authenticate(), require('./test'));
module.exports = router;
