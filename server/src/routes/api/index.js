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

// Feeding Schedule routes
router.get(
  '/baby/:id/getFeedingSchedules',
  require('./baby/getFeedingSchedules')
);

router.put(
  '/baby/:id/updateFeedingSchedule/:mealId',
  require('./baby/updateFeedingSchedule')
);

router.delete(
  '/baby/:id/deleteFeedingSchedule/:mealId',
  require('./baby/deleteFeedingSchedule')
);

router.post(
  '/baby/:id/addFeedingSchedule',
  require('./baby/addFeedingSchedule')
);

// router.post('/addSchedule', require('./addSchedule'));

// router.get("/getProfile", require("./getProfile"));

router.get('/user/:id/getBabyProfiles', require('./getBabyProfiles'));

//************ /user routes ************
router.get('/user/:id', require('./user/getUser').getUserById);

router.put('/user/:id', require('./user/putUser').updateUserById);

router.delete('/user/:id', require('./user/deleteUser').deleteUserById);

// Testing the authentication middleware
// router.get('/test', authenticate(), require('./test'));
module.exports = router;
