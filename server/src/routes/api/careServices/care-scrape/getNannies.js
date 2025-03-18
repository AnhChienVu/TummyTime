/**
 * server/src/routes/api/careServices/care-scraping/getNannies.js
 * Implementation for scraping Care.com for nanny providers
 */
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const logger = require("../../../../utils/logger");
const { createSuccessResponse, createErrorResponse } = require("../../../../utils/response");

puppeteer.use(StealthPlugin());

/**
 * getNannies - Scrapes Care.com specifically for nanny providers
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
module.exports.getNannies = async (req, res) => {
  const { location = "", limit = 20 } = req.query;

  logger.info(`Scraping Care.com for nannies${location ? ` in ${location}` : ''}`);

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

    // Base URL for nannies
    let url = "https://www.care.com/en-ca/profiles/child-care/nannies";

    // Add location parameters if provided
    if (location) {
      url = `${url}?location=${encodeURIComponent(location)}`;
    }

    logger.info(`Navigating to: ${url}`);
    await page.goto(url, { waitUntil: "networkidle2" });

    // Wait for provider snippets to load
    await page.waitForSelector(".providerSnippet", { timeout: 10000 }).catch(() => {
      logger.info("Provider snippet selector timed out, continuing anyway");
    });

    // Scroll down to load lazy-loaded content
    logger.info("Scrolling to load additional content");
    await autoScroll(page);

    // Take a screenshot for debugging
    try {
      await page.screenshot({ path: 'nanny-page-structure.png', fullPage: true });
      logger.info("Saved page screenshot for debugging");
    } catch (screenshotErr) {
      logger.error(`Failed to save screenshot: ${screenshotErr.message}`);
    }

    // Extract data from the nanny provider cards using specific selectors for nannies
    logger.info("Extracting nanny data");
    const nannies = await page.evaluate((maxProviders) => {
      // Target the specific class structure seen in the screenshots
      const cards = Array.from(document.querySelectorAll("div.providerSnippet.noJsProviderSnippet.robustProviderProfilesRedesign"));

      console.log(`Found ${cards.length} nanny cards`);

      return cards.slice(0, maxProviders).map(card => {
        try {
          // Extract name using the exact class structure shown in screenshots
          const nameEl = card.querySelector("span.name");
          const name = nameEl ? nameEl.textContent.trim() : "Unknown Provider";

          // Extract location (format: "| Montreal")
          const locationEl = card.querySelector("span.location");
          const location = locationEl ? locationEl.textContent.replace("|", "").trim() : "";

          // Extract premium status
          const premiumEl = card.querySelector(".premiumBadgeWrapper");
          const isPremium = !!premiumEl;

          // Extract rating
          const ratingEl = card.querySelector(".robustProviderAverage");
          const rating = ratingEl ? parseFloat(ratingEl.textContent.trim()) : null;

          // Extract reviews count
          const reviewsEl = card.querySelector(".robustProviderReviewsCount");
          const reviewsCount = reviewsEl ? parseInt(reviewsEl.textContent.trim(), 10) : 0;

          // Extract profile image
          const photoEl = card.querySelector(".member-photo-container img");
          const profileImage = photoEl ? photoEl.getAttribute("src") : null;

          // Extract years of experience - UPDATED SELECTOR
          let experience = null;

          // Try multiple selectors to find experience info
          const experienceSelectors = [
            "li.hidden-xs.robustProviderProfilesElement span", // Primary selector
            ".hidden-xs.robustProviderProfilesElement", // Alternate 1
            "li.robustProviderProfilesElement span", // Alternate 2
            ".hidden-xs span:contains('experience')", // Alternate 3
            "span:contains('years experience')" // Fallback
          ];

          for (const selector of experienceSelectors) {
            try {
              const expElements = card.querySelectorAll(selector);
              if (expElements && expElements.length > 0) {
                for (const el of expElements) {
                  const text = el.textContent.trim();
                  const expMatch = text.match(/(\d+)\s+years?\s+experience/i);
                  if (expMatch) {
                    experience = parseInt(expMatch[1], 10);
                    break;
                  }
                }
                if (experience !== null) break; // Found experience, stop searching
              }
            } catch (e) {
              console.log("Error with selector:", selector, e);
              // Continue to next selector
            }
          }

          // If still not found, check the entire card HTML
          if (experience === null) {
            const cardHTML = card.innerHTML;
            const fullMatch = cardHTML.match(/(\d+)\s+years?\s+experience/i);
            if (fullMatch) {
              experience = parseInt(fullMatch[1], 10);
            }
          }

          // Extract age
          const ageEl = card.querySelector("li.hidden-xs span");
          let age = null;
          if (ageEl) {
            const ageText = ageEl.textContent.trim();
            const ageMatch = ageText.match(/Age:\s*(\d+)/i);
            if (ageMatch) {
              age = parseInt(ageMatch[1], 10);
            }
          }

          // Fallback for age extraction if not found with the primary method
          if (age === null) {
            const ageElements = card.querySelectorAll(".hidden-xs span");
            for (const el of ageElements) {
              const text = el.textContent.trim();
              const ageMatch = text.match(/Age:\s*(\d+)/i);
              if (ageMatch) {
                age = parseInt(ageMatch[1], 10);
                break;
              }
            }
          }

          // Second fallback - check entire card HTML for age
          if (age === null) {
            const cardHTML = card.innerHTML;
            const fullAgeMatch = cardHTML.match(/Age:\s*(\d+)/i);
            if (fullAgeMatch) {
              age = parseInt(fullAgeMatch[1], 10);
            }
          }

          // Extract hourly rate
          const rateWrapperEl = card.querySelector(".robustProviderRateWrapper");
          let hourlyRate = null;
          if (rateWrapperEl) {
            const currencyEl = rateWrapperEl.querySelector(".currency");
            const currency = currencyEl ? currencyEl.textContent.trim() : "$";

            const rateText = rateWrapperEl.textContent.trim();
            const match = rateText.match(/\$(\d+(\.\d+)?)/);
            hourlyRate = match ? parseFloat(match[1]) : null;
          }

          // Extract bio/description
          const bioEl = card.querySelector(".experienceSummaryText");
          const bio = bioEl ? bioEl.textContent.trim() : "";

          // Extract profile title/headline if available
          const titleEl = card.querySelector(".profile-title");
          const title = titleEl ? titleEl.textContent.trim() : "";

          // Extract verification status
          const verificationEl = card.querySelector(".verificationsCount");
          const verification = !!verificationEl;

          // Extract profile URL
          const profileLinkEl = card.querySelector("a.profileLink");
          const profileUrl = profileLinkEl ? profileLinkEl.getAttribute("href") : null;

          // Extract hire count (e.g., "Hired 2 times")
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

          // Extract reviews if available
          let reviewText = null;
          const reviewEl = card.querySelector(".reviewContent");
          if (reviewEl) {
            reviewText = reviewEl.textContent.trim();

            // Extract reviewer name
            const reviewerEl = card.querySelector(".reviewAuthor b");
            if (reviewerEl) {
              const reviewerName = reviewerEl.textContent.trim();
              reviewText += ` - ${reviewerName}`;
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
            hiredCount,
            featuredReview: reviewText
          };
        } catch (err) {
          console.log("Error extracting data from nanny card:", err.message);
          return null;
        }
      }).filter(item => item !== null); // Filter out failed extractions
    }, parseInt(limit, 10));

    // Filter out any incomplete entries
    const validNannies = nannies.filter(n => n && n.name && n.name !== "Unknown Provider");

    logger.info(`Found ${validNannies.length} valid nannies`);

    // If no nannies were found after filtering, provide a helpful message
    if (validNannies.length === 0) {
      logger.info("No nannies found with extraction approach");

      return res.json(createSuccessResponse({
        location,
        totalFound: 0,
        nannies: [],
        message: "No nannies found. The site may have changed structure or the search returned no results."
      }));
    }

    // Return the results as JSON
    return res.json(createSuccessResponse({
      location,
      totalFound: validNannies.length,
      nannies: validNannies,
    }));
  } catch (err) {
    logger.error(`Error scraping nannies from Care.com: ${err.message}`);
    return res.status(500).json(createErrorResponse(500, `Error accessing nanny provider data: ${err.message}`));
  } finally {
    if (browser) {
      await browser.close();
      logger.info("Browser closed");
    }
  }
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
