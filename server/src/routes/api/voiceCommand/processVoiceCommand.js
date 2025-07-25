// src/routes/api/addBaby.js
const pool = require('../../../../database/db');
const {
  createSuccessResponse,
  createErrorResponse,
} = require('../../../utils/response');

module.exports.processVoiceCommand = async (req, res) => {
  const { text } = req.body;

  try {
    if (text === 'profile') {
      return res
        .status(200)
        .json(createSuccessResponse({ message: 'profile' }));
    } else if (text === 'sign out') {
      return res
        .status(200)
        .json(createSuccessResponse({ message: 'sign out' }));
    } else if (text === 'feeding schedule') {
      return res
        .status(200)
        .json(createSuccessResponse({ message: 'feeding schedule' }));
    } else if (text === 'settings') {
      return res
        .status(200)
        .json(createSuccessResponse({ message: 'settings' }));
    } else if (text === 'dashboard') {
      return res
        .status(200)
        .json(createSuccessResponse({ message: 'dashboard' }));
    } else {
      return res
        .status(404)
        .json(createErrorResponse(404, 'Voice command not found'));
    }
  } catch (error) {
    console.error('Voice command can not be processed. Try again!', error);
    return res
      .status(500)
      .json(createErrorResponse(500, 'Internal server error'));
  }
};
