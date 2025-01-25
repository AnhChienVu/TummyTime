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

router.post("/addBaby", require("./addBaby"));

router.get("/getProfile", require("./getProfile"));

router.get("/getBabyProfiles", require("./getBabyProfiles"));


//************ /users routes ************
router.get('/users/:id', require('./users/getUsers').getUserById);

router.put('/users/:id', require('./users/putUsers').updateUserById);

router.delete('/users/:id', require('./users/deleteUsers').deleteUserById);

// Testing the authentication middleware
// router.get('/test', authenticate(), require('./test'));
module.exports = router;
