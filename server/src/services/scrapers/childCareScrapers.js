/**
 * server/src/services/scrapers/childcareScrapers.js
 * Unified scraping module for childcare providers
 */
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const logger = require("../../utils/logger");

puppeteer.use(StealthPlugin());

// Define URLs for different types of care providers
const CARE_URLS = {
  babysitters: "https://www.care.com/en-ca/profiles/child-care/babysitters",
  nannies: "https://www.care.com/en-ca/profiles/child-care/nannies",
  tutors: "https://www.care.com/en-ca/profiles/tutoring",
  "child-care": "https://www.care.com/en-ca/profiles/child-care", // Default/all
  "special-needs": "https://www.care.com/en-ca/profiles/special-needs",
};

/**
 * Helper function to scroll down the page to load all lazy-loaded content
 *
 * @param {Object} page - Puppeteer page object
 */
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const maxScrolls = 50; // Limit scrolling to prevent infinite loops
      let scrollCount = 0;

      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        scrollCount++;

        if (totalHeight >= scrollHeight - window.innerHeight || scrollCount >= maxScrolls) {
          clearInterval(timer);
          resolve();
        }
      }, 250); // Slower scrolling to ensure content loads
    });
  });

  // Wait a bit extra for any final loading
  await new Promise(resolve => setTimeout(resolve, 2000));
}

/**
 * Unified scraping function for childcare providers
 *
 * @param {string} type - Type of provider to scrape ('babysitters', 'nannies', etc.)
 * @param {string} location - Location to search for providers
 * @param {number} limit - Maximum number of providers to return
 * @returns {Object} Object containing provider data
 */
async function scrapeChildcareProviders(type = "babysitters", location = "Toronto", limit = 20) {
  logger.info(`Scraping Care.com for ${type} in ${location}`);

  let browser;
  try {
    // Launch puppeteer with stealth mode to avoid detection
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-web-security",
        "--disable-features=IsolateOrigins,site-per-process"
      ],
    });

    const page = await browser.newPage();

    // Set a realistic user agent and viewport
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
    );

    // Set a larger viewport to see more content
    await page.setViewport({
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
    });

    // Enable JavaScript console logs from the page
    page.on('console', msg => logger.info(`PAGE LOG: ${msg.text()}`));

    // Determine the URL to scrape based on the requested type
    const baseUrl = CARE_URLS[type] || CARE_URLS["babysitters"];

    // Add location parameters if provided
    let url = baseUrl;
    if (location) {
      // Care.com uses location in URL path for filtering
      url = `${baseUrl}?location=${encodeURIComponent(location)}`;
    }

    logger.info(`Navigating to: ${url}`);
    await page.goto(url, { waitUntil: "networkidle2" });

    // Scroll down to load lazy-loaded content
    logger.info("Scrolling to load additional content");
    await autoScroll(page);

    // Extract data from the provider cards using multiple selector strategies
    logger.info("Extracting provider data");
    const providers = await page.evaluate((maxProviders) => {
      // Try multiple selector strategies to find provider cards
      // Primary selector from the screenshot
      let cards = Array.from(document.querySelectorAll("div.providerSnippet.noJsProviderSnippet.robustProviderProfilesRedesign"));

      console.log("Found " + cards.length + " cards with primary selector");

      // If primary selector didn't find anything, try fallback selectors
      if (cards.length === 0) {
        cards = Array.from(document.querySelectorAll("[class*='providerSnippet']"));
        console.log("Found " + cards.length + " cards with fallback selector 1");
      }

      // If still nothing, try even more generic selectors
      if (cards.length === 0) {
        cards = Array.from(document.querySelectorAll("[class*='provider'], [class*='caregiver'], [class*='profile-card']"));
        console.log("Found " + cards.length + " cards with fallback selector 2");
      }

      return cards.slice(0, maxProviders).map(card => {
        try {
          // Extract name and location using the exact class structure shown in screenshots
          const nameEl = card.querySelector("span.name");
          const locationEl = card.querySelector("span.location");

          const name = nameEl ? nameEl.textContent.trim() : "Unknown Provider";
          let location = "";

          if (locationEl) {
            // Clean up location text (remove the "|" separator)
            location = locationEl.textContent.replace("|", "").trim();
          }

          // Check if Premium badge exists
          const premiumBadge = card.querySelector(".premium");
          const isPremium = !!premiumBadge;

          // Extract rating from the exact class shown in screenshot
          const ratingEl = card.querySelector(".robustProviderAverage");
          const rating = ratingEl ? parseFloat(ratingEl.textContent.trim()) : null;

          // Extract reviews count
          const reviewsEl = card.querySelector(".robustProviderReviewsCount");
          const reviewsCount = reviewsEl ? parseInt(reviewsEl.textContent.trim(), 10) : 0;

          // Extract profile image using exact selector from screenshot
          const photoImg = card.querySelector("img.photo-circle");
          const profileImage = photoImg ? photoImg.getAttribute("src") : null;

          // Extract price using the exact rate wrapper structure
          const rateWrapper = card.querySelector(".robustProviderRateWrapper");
          let hourlyRate = null;
          if (rateWrapper) {
            // Look for the currency and rate value
            const currencyEl = rateWrapper.querySelector(".currency");
            const rateText = rateWrapper.textContent.trim();
            const match = rateText.match(/\$(\d+(\.\d+)?)/);
            hourlyRate = match ? parseFloat(match[1]) : null;
          }

          // Extract experience and age from bio or summary text
          const summaryEl = card.querySelector(".experienceSummaryText");
          const bio = summaryEl ? summaryEl.textContent.trim() : "";

          // Extract years of experience and age
          let experience = null;
          let age = null;

          // Look for experience details (e.g., "10 years experience")
          const experienceMatch = bio.match(/(\d+)\s+years?\s+experience/i) ||
                                 card.innerHTML.match(/(\d+)\s+years?\s+experience/i);
          if (experienceMatch) {
            experience = parseInt(experienceMatch[1], 10);
          }

          // Look for age details (e.g., "Age: 30")
          const ageMatch = bio.match(/Age:?\s*(\d+)/i) ||
                           card.innerHTML.match(/Age:?\s*(\d+)/i);
          if (ageMatch) {
            age = parseInt(ageMatch[1], 10);
          }

          // Get profile URL
          const profileLink = card.querySelector("a.profileLink");
          const profileUrl = profileLink ? profileLink.getAttribute("href") : null;

          // Check for verification badges
          const verifiedEl = card.querySelector(".verified, [class*='verified']");
          const verification = !!verifiedEl;

          // Extract title/headline if available (more common for nannies)
          const titleEl = card.querySelector(".profile-title");
          const title = titleEl ? titleEl.textContent.trim() : "";

          // Extract hire count if available
          const hiredEl = card.querySelector(".hiredCount .label");
          let hiredCount = 0;
          if (hiredEl) {
            const hiredText = hiredEl.textContent.trim();
            const hiredMatch = hiredText.match(/Hired\s+(\d+)/i);
            if (hiredMatch) {
              hiredCount = parseInt(hiredMatch[1], 10);
            } else if (hiredText.toLowerCase().includes("hired once")) {
              hiredCount = 1;
            }
          }

          return {
            name,
            location,
            rating,
            reviewsCount,
            experience: experience ? `${experience} years` : null,
            age,
            hourlyRate,
            title,
            bio,
            isPremium,
            profileUrl,
            profileImage,
            verification,
            hiredCount
          };
        } catch (err) {
          console.log("Error extracting data from provider card:", err.message);
          return null;
        }
      }).filter(item => item !== null); // Filter out failed extractions
    }, parseInt(limit, 10));

    // Filter out any incomplete entries
    const validProviders = providers.filter(p => p && p.name && p.name !== "Unknown Provider");

    logger.info(`Found ${validProviders.length} valid providers`);

    // Return the results
    return {
      type,
      location,
      totalFound: validProviders.length,
      providers: validProviders,
    };
  } catch (err) {
    logger.error(`Error scraping Care.com: ${err.message}`);
    throw err;
  } finally {
    if (browser) {
      await browser.close();
      logger.info("Browser closed");
    }
  }
}

module.exports = {
  scrapeChildcareProviders
};
