/**
 * server/src/services/careServicesCache.js
 * Service for caching and periodically updating childcare provider data
 */
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');
const { scrapeChildcareProviders } = require('./scrapers/childCareScrapers');

// Cache file paths
const CACHE_DIR = path.join(__dirname, '../cache');
const BABYSITTERS_CACHE = path.join(CACHE_DIR, 'babysitters_cache.json');
const NANNIES_CACHE = path.join(CACHE_DIR, 'nannies_cache.json');

// Default locations to cache during initialization
const DEFAULT_LOCATIONS = ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa'];

// Cache duration in milliseconds (e.g., 12 hours)
const CACHE_DURATION = 12 * 60 * 60 * 1000;

// In-memory cache storage
let cachedData = {
  babysitters: {
    lastUpdated: null,
    dataByLocation: {},
  },
  nannies: {
    lastUpdated: null,
    dataByLocation: {},
  },
};

/**
 * Initialize the cache directory and files
 */
async function initCacheDirectory() {
  try {
    // Create cache directory if it doesn't exist
    await fs.mkdir(CACHE_DIR, { recursive: true });
    logger.info('Cache directory initialized');
  } catch (err) {
    logger.error(`Error initializing cache directory: ${err.message}`);
  }
}

/**
 * Load cached data from disk
 */
async function loadCachedData() {
  try {
    // Try to load babysitters cache
    try {
      const babysittersData = await fs.readFile(BABYSITTERS_CACHE, 'utf8');
      cachedData.babysitters = JSON.parse(babysittersData);
      logger.info(
        `Loaded babysitters cache from disk. Last updated: ${new Date(
          cachedData.babysitters.lastUpdated
        )}`
      );
    } catch (err) {
      if (err.code !== 'ENOENT') {
        logger.error(`Error loading babysitters cache: ${err.message}`);
      } else {
        logger.info('No existing babysitters cache found');
      }
    }

    // Try to load nannies cache
    try {
      const nanniesData = await fs.readFile(NANNIES_CACHE, 'utf8');
      cachedData.nannies = JSON.parse(nanniesData);
      logger.info(
        `Loaded nannies cache from disk. Last updated: ${new Date(cachedData.nannies.lastUpdated)}`
      );
    } catch (err) {
      if (err.code !== 'ENOENT') {
        logger.error(`Error loading nannies cache: ${err.message}`);
      } else {
        logger.info('No existing nannies cache found');
      }
    }
  } catch (err) {
    logger.error(`Error loading cached data: ${err.message}`);
  }
}

/**
 * Save cache data to disk
 */
async function saveCacheData() {
  try {
    await fs.writeFile(BABYSITTERS_CACHE, JSON.stringify(cachedData.babysitters), 'utf8');
    await fs.writeFile(NANNIES_CACHE, JSON.stringify(cachedData.nannies), 'utf8');
    logger.info('Cache data saved to disk');
  } catch (err) {
    logger.error(`Error saving cache data: ${err.message}`);
  }
}

/**
 * Initialize the cache with popular locations
 */
async function initializeCache() {
  logger.info('Initializing care services cache...');

  await initCacheDirectory();
  await loadCachedData();

  // Check if cache is expired or doesn't exist
  const now = Date.now();
  const shouldUpdateBabysitters =
    !cachedData.babysitters.lastUpdated ||
    now - cachedData.babysitters.lastUpdated > CACHE_DURATION;
  const shouldUpdateNannies =
    !cachedData.nannies.lastUpdated || now - cachedData.nannies.lastUpdated > CACHE_DURATION;

  if (shouldUpdateBabysitters || shouldUpdateNannies) {
    logger.info('Cache is expired or missing, starting update process...');

    // Start updating cache in the background
    updateCache()
      .then(() => logger.info('Initial cache update completed'))
      .catch((err) => logger.error(`Initial cache update failed: ${err.message}`));
  }

  // Set up periodic cache refresh
  setInterval(() => {
    updateCache()
      .then(() => logger.info('Periodic cache update completed'))
      .catch((err) => logger.error(`Periodic cache update failed: ${err.message}`));
  }, CACHE_DURATION);

  logger.info('Cache initialization complete');
}

/**
 * Update the cache with fresh data
 */
async function updateCache() {
  logger.info('Starting cache update process');

  // First create new data objects
  const newBabysittersData = {
    lastUpdated: Date.now(),
    dataByLocation: {},
  };

  const newNanniesData = {
    lastUpdated: Date.now(),
    dataByLocation: {},
  };

  // Process each default location
  for (const location of DEFAULT_LOCATIONS) {
    try {
      // Get babysitters for this location
      logger.info(`Scraping babysitters for ${location}`);
      const babysittersResult = await scrapeChildcareProviders('babysitters', location);
      if (
        babysittersResult &&
        babysittersResult.providers &&
        babysittersResult.providers.length > 0
      ) {
        newBabysittersData.dataByLocation[location] = babysittersResult;
        logger.info(`Cached ${babysittersResult.providers.length} babysitters for ${location}`);
      }

      // Give the server a moment to breathe between requests
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Get nannies for this location
      logger.info(`Scraping nannies for ${location}`);
      const nanniesResult = await scrapeChildcareProviders('nannies', location);
      if (nanniesResult && nanniesResult.providers && nanniesResult.providers.length > 0) {
        newNanniesData.dataByLocation[location] = nanniesResult;
        logger.info(`Cached ${nanniesResult.providers.length} nannies for ${location}`);
      }

      // Give the server a moment to breathe between locations
      await new Promise((resolve) => setTimeout(resolve, 5000));
    } catch (err) {
      logger.error(`Error updating cache for ${location}: ${err.message}`);
      // Continue with other locations even if one fails
    }
  }

  // Update the cache atomically
  cachedData.babysitters = newBabysittersData;
  cachedData.nannies = newNanniesData;

  // Save to disk
  await saveCacheData();
  logger.info('Cache update completed and saved to disk');
}

/**
 * Get babysitters from cache for a specific location
 *
 * @param {string} location - Location to retrieve babysitters for
 * @param {number} limit - Maximum number of results to return
 * @returns {Object} Object containing babysitters data
 */
function getCachedBabysitters(location, limit = 20) {
  const normalizedLocation = location.trim().toLowerCase();

  // Check if we have this location in cache
  for (const [cachedLocation, data] of Object.entries(cachedData.babysitters.dataByLocation)) {
    if (
      cachedLocation.toLowerCase().includes(normalizedLocation) ||
      normalizedLocation.includes(cachedLocation.toLowerCase())
    ) {
      // Apply the limit
      const providers = data.providers.slice(0, limit);

      return {
        type: 'babysitters',
        location: cachedLocation,
        totalFound: providers.length,
        providers,
        cached: true,
        lastUpdated: new Date(cachedData.babysitters.lastUpdated).toISOString(),
      };
    }
  }

  // If no direct match, return the first location's data as fallback
  const fallbackLocation = Object.keys(cachedData.babysitters.dataByLocation)[0];
  if (fallbackLocation) {
    const data = cachedData.babysitters.dataByLocation[fallbackLocation];
    const providers = data.providers.slice(0, limit);

    return {
      type: 'babysitters',
      location: fallbackLocation,
      totalFound: providers.length,
      providers,
      cached: true,
      fallback: true,
      requestedLocation: location,
      lastUpdated: new Date(cachedData.babysitters.lastUpdated).toISOString(),
    };
  }

  // If no data at all
  return {
    type: 'babysitters',
    location,
    totalFound: 0,
    providers: [],
    cached: true,
    noData: true,
  };
}

/**
 * Get nannies from cache for a specific location
 *
 * @param {string} location - Location to retrieve nannies for
 * @param {number} limit - Maximum number of results to return
 * @returns {Object} Object containing nannies data
 */
function getCachedNannies(location, limit = 20) {
  const normalizedLocation = location.trim().toLowerCase();

  // Check if we have this location in cache
  for (const [cachedLocation, data] of Object.entries(cachedData.nannies.dataByLocation)) {
    if (
      cachedLocation.toLowerCase().includes(normalizedLocation) ||
      normalizedLocation.includes(cachedLocation.toLowerCase())
    ) {
      // Apply the limit
      const providers = data.providers.slice(0, limit);

      return {
        type: 'nannies',
        location: cachedLocation,
        totalFound: providers.length,
        providers,
        cached: true,
        lastUpdated: new Date(cachedData.nannies.lastUpdated).toISOString(),
      };
    }
  }

  // If no direct match, return the first location's data as fallback
  const fallbackLocation = Object.keys(cachedData.nannies.dataByLocation)[0];
  if (fallbackLocation) {
    const data = cachedData.nannies.dataByLocation[fallbackLocation];
    const providers = data.providers.slice(0, limit);

    return {
      type: 'nannies',
      location: fallbackLocation,
      totalFound: providers.length,
      providers,
      cached: true,
      fallback: true,
      requestedLocation: location,
      lastUpdated: new Date(cachedData.nannies.lastUpdated).toISOString(),
    };
  }

  // If no data at all
  return {
    type: 'nannies',
    location,
    totalFound: 0,
    providers: [],
    cached: true,
    noData: true,
  };
}

module.exports = {
  initializeCache,
  updateCache,
  getCachedBabysitters,
  getCachedNannies,
};
