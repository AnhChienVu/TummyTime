// src/routes/api/post.js

// ROUTE: POST /fragments
// This route will
//    +accept raw data
//    +check the Content - Type header
//    +create a new Fragment.
// If successful ==> return that fragment's metadata with a 201 Created status +set the Location header.
const contentType = require('content-type');
const { Fragment } = require('../../model/fragment');

// CHECK THE DATA and TYPE:
// -if they match each other
// -if the type is supported
// validateFragment (fragmentDataBuffer, fragmentType)
const { validateFragment } = require('../../validateType');

const logger = require('../../logger');
const { createSuccessResponse, createErrorResponse } = require('../../response');

/**
 * POST a list of fragments for the current user
 */
module.exports = async (req, res) => {
  try {
    if (!Buffer.isBuffer(req.body)) {
      const message = 'The request.body is not a Buffer';
      return res.status(400).json(createErrorResponse(400, message)); // 400 Bad Request
    }

    // Parse the full Content-Type (including charset if present)
    // parsedContentType: { type: 'text/plain', parameters: { charset: 'utf-8' } }
    const parsedContentType = contentType.parse(req);
    const baseType = parsedContentType.type;
    const charset = parsedContentType.parameters.charset || null;

    // Create full Content-Type string: 'text/plain; charset = utf-8'
    let fullContentType;
    if (charset) {
      fullContentType = `${baseType}; charset=${charset}`;
    } else {
      fullContentType = baseType;
    }

    let fragmentDataBuffer = req.body;

    try {
      await validateFragment(fragmentDataBuffer, baseType);
    } catch (err) {
      const message = `Error 415 Unsupported Type in Received Content-Type: ${fullContentType}: ${err.message}`;
      const errorResponse = createErrorResponse(415, message); // 415 Unsupported Media Type
      return res.status(415).json(errorResponse);
    }

    const ownerId = req.user;

    const size = req.body.length;
    const fragment = new Fragment({ ownerId, size, type: fullContentType });

    await fragment.save(); // save the fragment to the database
    await fragment.setData(req.body); // set the data in the database

    const API_URL = process.env.API_URL || req.headers.host;
    const locationUrl = `${API_URL}/v1/fragments/${fragment.id}`;

    const successResponse = createSuccessResponse({ fragments: [fragment] });
    logger.debug({ successResponse }, `POST /v1/fragments returning 201 Created: `);
    res.status(201).set('Location', locationUrl).json(successResponse); // 201 Created
  } catch (err) {
    const status = err.status || 500;
    const message =
      err.message || 'Inside API-POST, in CATCH,500-- Internal Server Error in POST /v1/fragments';
    if (status > 499) {
      logger.error({ err }, message);
    }
    res.status(status).json(createErrorResponse(status, err.message));
  }
};
