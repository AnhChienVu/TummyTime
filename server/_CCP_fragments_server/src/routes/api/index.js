// src/routes/api/index.js

// The main entry-point for the v1 version of the fragments API.
const express = require('express');
const contentType = require('content-type');
const { Fragment } = require('../../model/fragment');

const router = express.Router();

//** ROUTE: GET /v1/fragments (or /fragments?expand=1)
// return a list of all fragment IDs for the current user
router.get('/fragments', require('./get').getFragmentIdsWithEXPANDED);

//** ROUTE: GET /v1/fragments/:Id/info
// return a specific fragment METADATA
router.get('/fragments/:id/info', require('./get').getFragmentINFOById);

//** ROUTE: GET /v1/fragments/:Id(.EXT)
// return a specific fragment: METADATA + RAW DATA
router.get('/fragments/:id', require('./get').getFragmentDATAByIdWithEXT);

//** ROUTE: POST /v1/fragments
// BUFFER from RAW BODY PARSER of Express
// Use the built-in Express' RAW BODY PARSER to get a Buffer (i.e., raw binary data). We won't use body-parser or express.json()) because we want to handle the raw data directly.
// Support sending various Content-Types on the body
// up to 5M in size
const rawBody = () =>
  express.raw({
    inflate: true,
    limit: '5mb',
    type: (req) => {
      // See if we can parse this content type.
      // If we can parse, `req.body` will be a Buffer(e.g., `Buffer.isBuffer(req.body) === true`).
      // If not, `req.body` will be equal to an empty Object `{}` and `Buffer.isBuffer(req.body) === false`
      const { type } = contentType.parse(req); //==> parsedContentType: { type: 'text/html', parameters: { charset: 'utf-8' } }
      return Fragment.isSupportedType(type); // return true if supported
    },
  });

// Use a raw body parser for POST, which will give a `Buffer` Object or `{}` at `req.body`
router.post('/fragments', rawBody(), require('./post'));

// ** ROUTE: PUT /v1/fragments/:id
// Update a specific fragment by ID
router.put('/fragments/:id', rawBody(), require('./put'));

// ** ROUTE: DELETE /v1/fragments/:id
// Delete a specific fragment by ID
router.delete('/fragments/:id', require('./delete').deleteFragmentById);

module.exports = router;
