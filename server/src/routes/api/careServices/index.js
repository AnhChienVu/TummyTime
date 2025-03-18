/**
 * server/src/routes/api/careServices/index.js
 * Updated route handlers for care services using the cache
 */
const logger = require('../../../utils/logger');
const { getCachedBabysitters, getCachedNannies, updateCache } = require('../../../services/careServicesCache');
const { scrapeChildcareProviders } = require('../../../services/scrapers/childCareScrapers');
const { createSuccessResponse, createErrorResponse } = require('../../../utils/response');

/**
 * Handler for /careServices/babysitters endpoint
 * Retrieves babysitters data from cache when available
 */
exports.getBabysitters = async (req, res) => {
  const { location = 'Toronto', limit = 20, forceRefresh = false } = req.query;

  try {
    logger.info(`Getting babysitters for ${location}`);

    // Check for forced refresh flag
    if (forceRefresh === 'true') {
      logger.info(`Force refresh requested for babysitters in ${location}`);

      try {
        // This will be a slower response, but ensures fresh data
        const freshData = await scrapeChildcareProviders('babysitters', location, parseInt(limit, 10));

        // Return the fresh data
        return res.json(createSuccessResponse({
          ...freshData,
          forcedRefresh: true
        }));
      } catch (scrapeErr) {
        logger.error(`Error during forced refresh: ${scrapeErr.message}`);
        // Fall back to cache if scraping fails
        logger.info('Falling back to cached data after scraping error');
      }
    }

    // Get data from cache (which will be pre-loaded at server startup)
    const cachedData = getCachedBabysitters(location, parseInt(limit, 10));

    // Return the cached data
    return res.json(createSuccessResponse(cachedData));

  } catch (err) {
    logger.error(`Error retrieving babysitters: ${err.message}`);
    return res.status(500).json(createErrorResponse({
      error: {
        message: `Error retrieving babysitters data: ${err.message}`,
        code: 500
      }
    }));
  }
};

/**
 * Handler for /careServices/nannies endpoint
 * Retrieves nannies data from cache when available
 */
exports.getNannies = async (req, res) => {
  const { location = 'Toronto', limit = 20, forceRefresh = false } = req.query;

  try {
    logger.info(`Getting nannies for ${location}`);

    // Check for forced refresh flag
    if (forceRefresh === 'true') {
      logger.info(`Force refresh requested for nannies in ${location}`);

      try {
        // This will be a slower response, but ensures fresh data
        const freshData = await scrapeChildcareProviders('nannies', location, parseInt(limit, 10));

        // Return the fresh data
        return res.json(createSuccessResponse({
          ...freshData,
          forcedRefresh: true
        }));
      } catch (scrapeErr) {
        logger.error(`Error during forced refresh: ${scrapeErr.message}`);
        // Fall back to cache if scraping fails
        logger.info('Falling back to cached data after scraping error');
      }
    }

    // Get data from cache (which will be pre-loaded at server startup)
    const cachedData = getCachedNannies(location, parseInt(limit, 10));

    // Return the cached data
    return res.json(createSuccessResponse(cachedData));

  } catch (err) {
    logger.error(`Error retrieving nannies: ${err.message}`);
    return res.status(500).json(createErrorResponse({
      error: {
        message: `Error retrieving nannies data: ${err.message}`,
        code: 500
      }
    }));
  }
};

/**
 * Admin endpoint to manually trigger a cache refresh
 * This could be restricted to admin users with appropriate middleware
 */
exports.refreshCareCache = async (req, res) => {
  try {
    logger.info('Manual cache refresh triggered');

    // Start the cache update in the background
    updateCache()
      .then(() => logger.info('Manual cache refresh completed'))
      .catch(err => logger.error(`Manual cache refresh error: ${err.message}`));

    // Return immediately, don't wait for the update to complete
    return res.json(createSuccessResponse({
      message: 'Cache refresh started',
      status: 'processing'
    }));
  } catch (err) {
    logger.error(`Error starting cache refresh: ${err.message}`);
    return res.status(500).json(createErrorResponse({
      error: {
        message: `Error starting cache refresh: ${err.message}`,
        code: 500
      }
    }));
  }
};
