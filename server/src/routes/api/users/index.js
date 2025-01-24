// src/routes/api/users/index.js
// All /users routes

const express = require('express');
const router = express.Router();

// POST /signup route: create a new user + authentication
// router.post('/signup'..)

router.get('/users/:id', require('./getUsers').getUserById);
router.put('/users/:id', require('./putUsers').updateUserById);
router.delete('/users/:id', require('./deleteUsers').deleteUserById);

module.exports = router;
