// src/validateType.js

const yaml = require('js-yaml');
const sharp = require('sharp');

/** Valid Fragment Conversions
This is the current list of valid conversions for each fragment type (others may be added in the future):
| Type               | Valid Conversion Extensions              |
| ------------------ | ---------------------------------------- |
| `text/plain`       | `.txt`                                   |
| `text/markdown`    | `.md`, `.html`, `.txt`                   |
| `text/html`        | `.html`, `.txt`                          |
| `text/csv`         | `.csv`, `.txt`, `.json`                  |
| `application/json` | `.json`, `.yaml`, `.yml`, `.txt`         |
| `application/yaml` | `.yaml`, `.txt`                          |
| `image/png`        | `.png`, `.jpg`, `.webp`, `.gif`, `.avif` |
| `image/jpeg`       | `.png`, `.jpg`, `.webp`, `.gif`, `.avif` |
| `image/webp`       | `.png`, `.jpg`, `.webp`, `.gif`, `.avif` |
| `image/avif`       | `.png`, `.jpg`, `.webp`, `.gif`, `.avif` |
| `image/gif`        | `.png`, `.jpg`, `.webp`, `.gif`, `.avif` |
 */

// CHECK THE DATA and TYPE:
// -if they match each other
// -if the type is supported
module.exports.validateFragment = async (fragmentDataBuffer, fragmentType) => {
  try {
    if (!fragmentDataBuffer) {
      throw new Error(`ERROR: Fragment Data is empty`);
    }

    switch (fragmentType) {
      case 'text/plain':
      case 'text/markdown':
      case 'text/html':
      case 'text/csv':
        await validateTEXTSTRING(fragmentDataBuffer);
        break;

      case 'application/json':
        await validateJSON(fragmentDataBuffer);
        break;

      case 'application/yaml':
        await validateYAML(fragmentDataBuffer);
        break;

      case 'image/png':
      case 'image/jpeg':
      case 'image/webp':
      case 'image/gif':
      case 'image/avif':
        await validateIMAGE(fragmentDataBuffer, fragmentType);
        break;

      default:
        throw new Error(`Unsupported Type: ${fragmentType}`);
    }
  } catch (err) {
    throw new Error(`ERROR: ${err.message}`);
  }
};

const validateTEXTSTRING = (fragmentDataBuffer) => {
  // Convert Buffer to string
  const fragmentDataBufferString = fragmentDataBuffer.toString();

  if (typeof fragmentDataBufferString !== 'string') {
    throw new Error(`ERROR: fragmentDataBuffer is not a text string`);
  }
};

const validateJSON = (fragmentDataBuffer) => {
  try {
    JSON.parse(fragmentDataBuffer.toString());
  } catch (err) {
    throw new Error(`ERROR: fragmentDataBuffer is not a JSON: ${err.message}`);
  }
};

const validateYAML = (fragmentDataBuffer) => {
  try {
    yaml.load(fragmentDataBuffer.toString());
  } catch (err) {
    throw new Error(`ERROR: fragmentDataBuffer is not a YAML: ${err.message}`);
  }
};

// check for IMAGE: IF IT MATCH the checkingType
const validateIMAGE = async (fragmentDataBuffer, checkingType = 'UNPROVIDED') => {
  try {
    const metadata = await sharp(fragmentDataBuffer).metadata();
    let realFormatOfDATA = metadata.format;

    // Split the checkingType to get the type from 'image/png'
    checkingType = checkingType.split('/')[1];

    // NOTE-: HEIF returned by sharp --> is AVIF
    if (realFormatOfDATA === 'heif') {
      realFormatOfDATA = 'avif';
    }
    if (checkingType === 'heif') {
      checkingType = 'avif';
    }

    // check if the realFormatOfDATA matches the checkingType
    if (realFormatOfDATA !== checkingType) {
      throw new Error(`ERROR: fragmentDataBuffer is ${realFormatOfDATA} not a ${checkingType}`);
    }
  } catch (err) {
    throw new Error(`ERROR: fragmentDataBuffer is not an IMAGE: ${err.message}`);
  }
};
