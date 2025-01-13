// src/routes/api/put.js

// ROUTE: all PUT routes
const contentType = require('content-type');
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');

// CHECK THE DATA and TYPE:
// -if they match each other
// -if the type is supported
// validateFragment (fragmentDataBuffer, fragmentType)
const { validateFragment } = require('../../validateType');
const { createSuccessResponse, createErrorResponse } = require('../../response');

//PUT an existing fragment with new data
module.exports = async (req, res) => {
  try {
    if (!Buffer.isBuffer(req.body)) {
      const message = 'The request.body is not a Buffer';
      logger.warn(message);
    }

    const ownerId = req.user;
    const fragmentId = req.params.id;

    const fragment = await Fragment.byId(ownerId, fragmentId);
    if (!fragment) {
      return res.status(404).send({ error: 'in PUT, Fragment not found' });
    }

    const { type, parameters } = contentType.parse(req);
    const charset = parameters.charset || null;
    const size = req.body.length;

    let fullContentType;
    if (charset) {
      fullContentType = `${type}; charset=${charset}`;
    } else {
      fullContentType = type;
    }
    logger.info({ fullContentType }, `in PUT, Received fullContentType: `);

    let fragmentDataBuffer = req.body;

    try {
      await validateFragment(fragmentDataBuffer, type);
    } catch (err) {
      const errorResponse = createErrorResponse(
        415,
        `Error 415UnsupportedType in Received Content-Type: ${fullContentType}: ${err.message}`
      ); // 415 Unsupported Media Type
      return res.status(415).send(errorResponse);
    }

    // Check if the originaltype matches the newType
    if (fragment.mimeType !== type) {
      const errorResponse = createErrorResponse(400, `Fragment type cannot be changed`);
      return res.status(400).send(errorResponse); // 400 Bad Request from client
    }

    fragment.size = size;
    await fragment.save(); // save METADATA to the database

    await fragment.setData(fragmentDataBuffer); // set the fragment's data in the database

    // RETRIEVE AGAIN the fragment for COMPARISON
    const updatedFragment = await Fragment.byId(ownerId, fragment.id);

    const API_URL = process.env.API_URL || req.headers.host;
    const location = `${API_URL}/v1/fragments/${updatedFragment.id}`;
    res.location(location);

    const successResponse = createSuccessResponse({ fragment: updatedFragment });
    res.status(201).send(successResponse); // 201 Created
  } catch (err) {
    if (err.message.includes('not found')) {
      const errorResponse = createErrorResponse(404, `Fragment not found: ${err.message}`);
      return res.status(404).send(errorResponse); // 404 Not Found
    }

    const status = err.status || 500;
    const errorResponse = createErrorResponse(500, `Error deleting fragments: ${err.message}`);
    return res.status(status).send(errorResponse); // 500 general Internal Server Error
  }
};
