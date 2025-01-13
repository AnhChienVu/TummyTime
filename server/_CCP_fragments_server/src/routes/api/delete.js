// src/routes/api/delete.js

const { createSuccessResponse, createErrorResponse } = require('../../response');
const { Fragment } = require('../../model/fragment');

/**
 * ROUTE: DELETE /fragments/:id
 * DELETE a fragment (by its ID)
 */
module.exports.deleteFragmentById = async function (req, res) {
  try {
    const ownerId = req.user; // get the user's hashed email
    const fragmentId = req.params.id;

    const fragment = await Fragment.byId(ownerId, fragmentId);
    if (!fragment) {
      return res.status(404).json({ error: 'Fragment not found' });
    }

    // Delete the fragment
    await Fragment.delete(ownerId, fragmentId);

    const successResponse = createSuccessResponse();
    return res.status(200).json(successResponse);
  } catch (err) {
    if (err.message.includes('Fragment not found')) {
      const errorResponse = createErrorResponse(404, `Fragment not found: ${err.message}`);
      return res.status(404).json(errorResponse); // 404 Not Found
    }

    const errorResponse = createErrorResponse(500, `Error deleting fragments: ${err.message}`);
    return res.status(500).json(errorResponse); // 500 general Internal Server Error
  }
};
