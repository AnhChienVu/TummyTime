// src/conversion.js

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

const markdownit = require('markdown-it');
const sharp = require('sharp');
const csvtojson = require('csvtojson');
const logger = require('./logger');

// CONVERT from ORIGINAL TYPE to NEW TYPE
module.exports.getConvertedFragmentData = async (fragmentDataBuffer, originalFormat, newFormat) => {
  switch (newFormat) {
    case 'text/plain':
      return convertToTXT(fragmentDataBuffer, originalFormat);
    case 'text/html':
      return convertToHTML(fragmentDataBuffer, originalFormat);
    case 'application/json':
      return convertToJSON(fragmentDataBuffer, originalFormat);
    case 'application/yaml':
      return convertToYAML(fragmentDataBuffer, originalFormat);
    case 'image/png':
    case 'image/jpeg':
    case 'image/webp':
    case 'image/gif':
    case 'image/avif':
      return convertToIMAGE(fragmentDataBuffer, originalFormat, newFormat);
    default:
      throw new Error(`UNSUPPORTED CONVERSION: From ${originalFormat} To ${newFormat}`);
  }
};

// CONVERT from BUFFER to STRING
// "{\"type\":\"Buffer\",\"data\":[123,34,110,97,109,101,34,58,34,74,111,104,110,34,44,34,97,103,101,34,58,51,48,125]}"
// convertedData: {"name":"John","age":30}
const convertJSONBUFFERDataTOString = async (buffer) => {
  try {
    // Convert the buffer to a string
    if (!Buffer.isBuffer(buffer)) {
      throw new Error('ERROR: require JSON buffer --> this is not a Buffer');
    }

    const bufferString = buffer.toString('utf-8');

    // Match the array of numbers inside "[...]"
    // case1:
    // Expected substring: "{\"name\":\"John\",\"age\":30}"
    // Received string:    "{\"type\":\"Buffer\",\"data\":[123,34,110,97,109,101,34,58,34,74,111,104,110,34,44,34,97,103,101,34,58,51,48,125]}"
    if (
      bufferString[0] === '{' &&
      bufferString[bufferString.length - 1] === '}' &&
      bufferString.includes('data') &&
      bufferString.includes('[') &&
      bufferString.includes(']')
    ) {
      // Match the array of numbers inside "[...]"
      let bufferArray = bufferString.match(/\[(.*?)\]/)[1].split(',');

      // Convert each number to a character
      const charArray = bufferArray.map((num) => String.fromCharCode(parseInt(num)));

      // Join the array of characters into a string
      const stringLetters = charArray.join('');
      return stringLetters;
    }

    // case2:
    // "{\n  \"data\": \"This is a JSON fragment!\"\n}\n"
    // CASE2: NOT INCLUDE `[` and `]`
    //        and END WITH`}\n`
    const last5Chars = bufferString.slice(-5);
    if (bufferString[0] === '{' && last5Chars.includes('}') && bufferString.includes('data')) {
      return bufferString;
    }
    // THROW ERROR
    else {
      throw new Error('ERROR: Unsupported JSON buffer');
    }
  } catch (error) {
    throw new Error(`ERROR: JSON buffer --> cannot convert to string: ${error.message}`);
  }
};

// CONVERT from JSON STRING to YAML KEY-VALUE STRING
// JSON string:       '{"name":"John","age":30}';
// to YAML string ==> 'name: John\nage: 30\n';
const formatJSONSTRINGToYAMLString = async (jsonString) => {
  if (!jsonString) {
    throw new Error('ERROR: there is no input argument: jsonString');
  }

  if (typeof jsonString !== 'string') {
    throw new Error('ERROR: Invalid JSON string --> not a string');
  }

  if (jsonString[0] !== '{' || !jsonString.includes('}')) {
    throw new Error('ERROR: Invalid JSON string --> not a JSON object');
  }

  try {
    // Parse the JSON string into an object
    const jsonObject = JSON.parse(jsonString);

    // Convert the object to the desired key-value format
    const formattedString = Object.entries(jsonObject)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    return formattedString;
  } catch (error) {
    throw new Error(`ERROR: Invalid JSON string --> cannot JSON.parse(): ${error.message}`);
  }
};

const convertToTXT = async (fragmentDataBuffer, originalFormat) => {
  let convertedData;
  try {
    switch (originalFormat) {
      case 'application/json':
        convertedData = await convertJSONBUFFERDataTOString(fragmentDataBuffer);
        return convertedData;
      case 'application/yaml':
        convertedData = fragmentDataBuffer.toString();
        return convertedData;
      case 'text/html':
      case 'text/csv':
      case 'text/markdown':
        convertedData = fragmentDataBuffer.toString();
        return convertedData;
      default:
        throw new Error(`Unsupported Conversion: From ${originalFormat} To text/plain`);
    }
  } catch (err) {
    throw new Error(`ERROR: ${err.message}`);
  }
};

const convertToHTML = async (fragmentDataBuffer, originalFormat) => {
  const md = markdownit();

  switch (originalFormat) {
    case 'text/markdown':
      return md.render(fragmentDataBuffer.toString());
    default:
      throw new Error(`Unsupported Conversion: From ${originalFormat} To text/html`);
  }
};

const convertToJSON = async (fragmentDataBuffer, originalFormat) => {
  switch (originalFormat) {
    case 'text/csv':
      return csvtojson().fromString(fragmentDataBuffer.toString());
    default:
      throw new Error(`Unsupported Conversion: From ${originalFormat} To application/json`);
  }
};

const convertToYAML = async (fragmentDataBuffer, originalFormat) => {
  let convertedData;
  try {
    switch (originalFormat) {
      case 'application/json':
        convertedData = await convertJSONBUFFERDataTOString(fragmentDataBuffer);

        if (!convertedData) {
          logger.warn(`convertJSONBUFFERDataTOString() returned NOTHING for convertedData`);
        }

        convertedData = await formatJSONSTRINGToYAMLString(convertedData);
        return convertedData;
      default:
        throw new Error(`Unsupported Conversion: From ${originalFormat} To application/yaml`);
    }
  } catch (err) {
    throw new Error(`Inside conversion.js --convertToYAML(), in CATCH, ERROR: ${err.message}`);
  }
};

// CONVERT from ORIGINAL IMAGE to NEW IMAGE
const convertToIMAGE = async (fragmentDataBuffer, originalFormat, newFormat) => {
  const image = sharp(fragmentDataBuffer);

  switch (newFormat) {
    case 'image/png':
      return image.png().toBuffer();
    case 'image/jpeg':
      return image.jpeg().toBuffer();
    case 'image/webp':
      return image.webp().toBuffer();
    case 'image/gif':
      return image.gif().toBuffer();
    case 'image/avif':
      return image.avif().toBuffer();
    default:
      throw new Error(`Unsupported Conversion: From ${originalFormat} To ${newFormat}`);
  }
};
