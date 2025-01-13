// src/routes/api/get.js

// ROUTE: all GET routes

const { createSuccessResponse, createErrorResponse } = require('../../response');
const { Fragment } = require('../../model/fragment');
const { getConvertedFragmentData } = require('../../conversion');
const logger = require('../../logger');

// ROUTE: GET /fragments  (?expand=1)
module.exports.getFragmentIdsWithEXPANDED = async (req, res) => {
  let expanded = false;
  if (req.query.expand) {
    expanded = req.query.expand === '1';
  }

  const ownerId = req.user;
  let fragmentIds;

  try {
    // FOR TESTING THROW by changing LOG_LEVEL to 'debug_throw';
    if (process.env.LOG_LEVEL === 'debug_throw') {
      throw new Error('Test error for POST /fragments');
    }

    if (expanded === false) {
      fragmentIds = await Fragment.byUser(ownerId, false);
    } else {
      fragmentIds = await Fragment.byUser(ownerId, true);
    }

    const successResponse = createSuccessResponse({ fragments: fragmentIds });
    return res.status(200).json(successResponse);
  } catch (err) {
    if (err.message.includes('not found')) {
      const errorResponse = createErrorResponse(404, `Fragment not found: ${err.message}`);
      return res.status(404).json(errorResponse); // 404 Not Found
    }

    const errorResponse = createErrorResponse(
      500,
      `500InternalServerError: Error GETTING fragments: ${err.message}`
    );
    return res.status(500).json(errorResponse); // 500 general Internal Server Error
  }
};

/**
 * ROUTE: GET /fragments/:ID/ INFO
 * GET an existing fragment's metadata
 */
module.exports.getFragmentINFOById = async (req, res) => {
  let id = req.params.id;

  const ownerId = req.user;

  // GET ALL FRAGMENTS IDS by USER
  const fragmentsByUser = await Fragment.byUser(ownerId, false);

  try {
    // check wrong fragment id
    if (!fragmentsByUser.includes(id)) {
      const errorResponse = createErrorResponse(404, `Fragment ${id} not found`);
      return res.status(404).json(errorResponse); // 404 Not Found
    }

    // GET FRAGMENT METADATA
    const fragment = await Fragment.byId(ownerId, id);
    return res.status(200).json(createSuccessResponse(fragment));
  } catch (err) {
    if (err.message.includes('not found')) {
      const errorResponse = createErrorResponse(404, `Fragment not found: ${err.message}`);
      return res.status(404).json(errorResponse); // 404 Not Found
    }

    const errorResponse = createErrorResponse(500, `Error GETTING fragments: ${err.message}`);
    return res.status(500).json(errorResponse); // 500 general Internal Server Error
  }
};

// ROUTE: GET /fragments/:ID .EXT  (==>get CONVERSION INTO EXT FORMAT)
module.exports.getFragmentDATAByIdWithEXT = async (req, res) => {
  let [id, receivedFormat = 'Unprovided'] = req.params.id.split('.');
  const ownerId = req.user; // OWNERID is user's hashed email

  try {
    // check ALL FRAGMENTS IDS of USER
    const fragmentsByUser = await Fragment.byUser(ownerId, false);

    // check wrong fragment id
    if (!fragmentsByUser.includes(id)) {
      logger.error(
        `Inside routes/api/get.js, GET /:ID.EXT --getFragmentDATAByIdWithEXT(), in TRY, return a 404NotFoundError: "Fragment ${id} not found"`
      );
      const errorResponse = createErrorResponse(404, `Fragment ${id} not found`);
      return res.status(404).json(errorResponse); // 404 Not Found
    }

    // GET FRAGMENT METADATA-DATA-ORIGINAL FORMAT by ID
    const fragment = await Fragment.byId(ownerId, id);
    const originalFormat = fragment.type;
    const fragmentDataBuffer = await fragment.getData();
    logger.info({ fragment }, `fragment metadata returned byId`);
    let dataBufferLength = fragmentDataBuffer.length;
    logger.info({ dataBufferLength }, `fragmentDataBuffer length:`);
    logger.info(`original format of fragment: ${originalFormat}`);
    let errorResponse;

    // convert EXT to MIME-TYPE
    if (receivedFormat === 'Unprovided') {
      receivedFormat = originalFormat;
    } else {
      switch (receivedFormat.toLowerCase()) {
        case 'txt':
          receivedFormat = 'text/plain';
          break;
        case 'md':
          receivedFormat = 'text/markdown';
          break;
        case 'html':
          receivedFormat = 'text/html';
          break;
        case 'csv':
          receivedFormat = 'text/csv';
          break;
        case 'json':
          receivedFormat = 'application/json';
          break;
        case 'yaml':
        case 'yml':
          receivedFormat = 'application/yaml';
          break;
        case 'png':
          receivedFormat = 'image/png';
          break;
        case 'jpg':
          receivedFormat = 'image/jpeg';
          break;
        case 'webp':
          receivedFormat = 'image/webp';
          break;
        case 'gif':
          receivedFormat = 'image/gif';
          break;
        case 'avif':
          receivedFormat = 'image/avif';
          break;

        default:
          errorResponse = createErrorResponse(
            415,
            `Unsupported Extension: ${receivedFormat} for Fragment ${id}. Supported extensions for Original format ${originalFormat} are: ${Fragment.formats}`
          ); // 415 Unsupported Media Type
          return res.status(415).json(errorResponse);
      }
    }

    const newFormat = receivedFormat;

    // if receivedFormat is the same as originalFormat or Unprovided => return original fragment DATA
    if (newFormat === originalFormat) {
      let dataBufferLength = fragmentDataBuffer.length;
      logger.info({ dataBufferLength }, `return ORIGINAL DATA of fragment ${id} with length: `);

      res.setHeader('Content-Type', fragment.type);
      return res.status(200).send(fragmentDataBuffer);
    }

    //===CONVERSION============================
    let supportedFormats = fragment.formats;

    if (!supportedFormats.includes(newFormat)) {
      errorResponse = createErrorResponse(
        415,
        `Unsupported Conversion: From ${originalFormat} To ${newFormat}. From ${originalFormat} can ONLY be converted to ${Fragment.formats}
        `
      ); // 415 Unsupported Media Type
      return res.status(415).json(errorResponse);
    }

    let convertedData = await getConvertedFragmentData(
      fragmentDataBuffer,
      originalFormat,
      newFormat
    );

    let convertedDataLength = convertedData.length;
    logger.info({ convertedDataLength }, `Converted Data Length: `);

    res.setHeader('Content-Type', newFormat);
    return res.status(200).send(convertedData); // 200 OK
  } catch (err) {
    if (err.message.includes('not found')) {
      const errorResponse = createErrorResponse(404, `Fragment not found: ${err.message}`);
      return res.status(404).json(errorResponse); // 404 Not Found
    }

    const errorResponse = createErrorResponse(500, `Error GETTING fragments: ${err.message}`);
    return res.status(500).json(errorResponse); // 500 general Internal Server Error
  }
};
