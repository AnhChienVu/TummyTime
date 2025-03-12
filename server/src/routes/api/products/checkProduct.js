// server/src/routes/api/products/checkProduct.js
// Route for GET /products/checkProduct?barcode=||productName=

const logger = require('../../../utils/logger');
const {
  createSuccessResponse,
  createErrorResponse,
} = require('../../../utils/response');
const fs = require('fs');
const path = require('path');
const Fuse = require('fuse.js');

// Load the recall dataset once (for faster access)
let recallsData = [];
const loadRecallData = () => {
  try {
    const dataPath = path.resolve(
      __dirname,
      '../../../../database/HCRSAMOpenData.json'
    );
    const data = fs.readFileSync(dataPath, 'utf8');
    recallsData = JSON.parse(data);
    console.log(`Loaded ${recallsData.length} recall records`);
    return recallsData;
  } catch (err) {
    logger.error(err, 'ERROR loading recall data');
  }
};

// GET /products/checkProduct?barcode=||productName= - Check a product to see if it has been recalled
module.exports.checkProduct = async (req, res) => {
  const recallsData = loadRecallData();
  const { barcode, productName } = req.query;
  if (!barcode && !productName) {
    return res
      .status(400)
      .send(createErrorResponse(400, 'Provide barcode or product name'));
  }

  try {
    // Get the product name from the barcode
    if (!productName) {
      const barcodeRes = await fetch(
        `https://api.barcodelookup.com/v3/products?barcode=${barcode}&formatted=y&key=${process.env.BARCODE_SCANNER_API_KEY}`
      );
      if (!barcodeRes.ok) {
        return res
          .status(400)
          .send(createErrorResponse(400, 'Invalid barcode'));
      }

      const data = await barcodeRes.json();
      logger.info('data', data);
      //   if (!data)
      const productName = data.products[0]?.title || null;
      if (!productName) {
        return res
          .status(404)
          .send(createErrorResponse(404, 'Product not found for this barcode'));
      }
    }

    // Filter Recalls for baby-related products
    const babyRecalls = recallsData.filter(
      (item) =>
        item.Category?.toLowerCase().includes('baby') ||
        item.Category?.toLowerCase().includes('child') ||
        item.Product?.toLowerCase().includes('baby') ||
        item.Product?.toLowerCase().includes('child') ||
        item.Title?.toLowerCase().includes('baby') ||
        item.Title?.toLowerCase().includes('child')
    );

    // Use Fuzzy search for best match
    const fuse = new Fuse(babyRecalls, {
      keys: ['Title', 'Product'],
      threshold: 0.3,
    });
    const fuzzyMatches = fuse.search(productName).map((result) => result.item);

    // Provide recommendations if no exact match
    let recommendations = [];
    if (fuzzyMatches.length === 0) {
      const similarRecalls = new Fuse(babyRecalls, {
        keys: ['Title', 'Product'],
        threshold: 0.5,
      });
      recommendations = similarRecalls
        .search(productName)
        .map((result) => result.item)
        .slice(0, 3);
    }

    let safetyLevel = fuzzyMatches.length > 0 ? 'Recalled' : 'Safe';

    res.json({
      barcode,
      product: productName,
      recalls: fuzzyMatches,
      recommendations,
      safetyLevel,
    });
  } catch (err) {
    logger.error(
      err,
      `ERROR in GET /products/checkProduct?barcode=||productName=`
    );

    res
      .status(500)
      .send(createErrorResponse(500, `Failed to fetch Product Safety API`));
  }
};
