// tests/unit/get.test.js

// This test USING BASIC AUTHENTICATION (username/password)
// USING LOCAL MEMORY DATABASE

const request = require('supertest');
const fs = require('fs'); // for reading files
const path = require('path');

const app = require('../../src/app');
const logger = require('../../src/logger');
const sharp = require('sharp'); // for image processing and conversion

//******* testing GET /v1/fragments (or /fragments?expand=1)
// returns an array of fragmentIDs or expanded fragment metadata
describe('GET /v1/fragments', () => {
  test('unauthenticated requests are denied', () => request(app).get('/v1/fragments').expect(401));

  test('incorrect credentials are denied', () =>
    request(app).get('/v1/fragments').auth('invalid@email.com', 'incorrect_password').expect(401));

  test('authenticated users with no fragments get an empty array', async () => {
    const res = await request(app).get('/v1/fragments').auth('user2@email.com', 'password2');

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragments).toEqual([]);
  });

  test('authenticated users get a fragments array', async () => {
    await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(Buffer.from('This is a test fragment as a buffer: 41 chars'));

    await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(Buffer.from('This is a test fragment as a buffer: 45 chars'));

    const res = await request(app).get('/v1/fragments').auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(Array.isArray(res.body.fragments)).toBe(true);
    expect(res.body.fragments.length).toBeGreaterThanOrEqual(1);
  });

  // Authenticated users can retrieve an array of expanded fragment metadata
  test('authenticated users get a EXPANDED fragments array', async () => {
    await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(Buffer.from('This is a test fragment as a buffer: 45 chars'));
    await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(Buffer.from('This is the test fragment No.2 as a buffer'));
    await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(Buffer.from('This is the test fragment No.3 as a buffer'));

    // check ?EXPAND=1
    const res = await request(app)
      .get('/v1/fragments?expand=1')
      .auth('user1@email.com', 'password1');

    // Check the expanded fragment metadata No.1
    let fragment = res.body.fragments;
    logger.info({ fragment }, 'Fragments EXPANDED returned: ');

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(Array.isArray(res.body.fragments)).toBe(true);
    expect(res.body.fragments.length).toBeGreaterThanOrEqual(3);

    // Check the expanded fragment metadata No.1
    fragment = res.body.fragments[0];
    expect(fragment).toHaveProperty('id');
    expect(fragment).toHaveProperty('ownerId');
    expect(fragment).toHaveProperty('size');

    // Check the expanded fragment metadata No.3
    fragment = res.body.fragments[2];
    expect(fragment).toHaveProperty('id');
    expect(fragment).toHaveProperty('ownerId');
    expect(fragment).toHaveProperty('size');
  });

  // Simulate an error being thrown in the route
  const OLD_ENV = process.env;

  test('Internal server error occurs', async () => {
    process.env.LOG_LEVEL = 'debug_throw';

    const res = await request(app).get('/v1/fragments').auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(500);
    expect(res.body.status).toBe('error');

    // Restore the original ENV
    process.env = OLD_ENV;
  });
});

// ******* testing GET /v1/fragments/:id/INFO
//returns an existing fragment's metadata
describe('GET /v1/fragments/:id/INFO', () => {
  test('authenticated users can get the original fragment metadata', async () => {
    const res0 = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(Buffer.from('This is a test fragment for getting metadata'));
    const fragmentId = res0.body.fragments[0].id;
    logger.info({ fragmentId }, 'Fragment ID: ');

    const res = await request(app)
      .get(`/v1/fragments/${fragmentId}/info`)
      .auth('user1@email.com', 'password1');

    const fragment = res.body;

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(fragment).toHaveProperty('id');
    expect(fragment).toHaveProperty('ownerId');
    expect(fragment).toHaveProperty('type', 'text/plain');
    expect(fragment).toHaveProperty('created');
    expect(fragment).toHaveProperty('updated');
  });

  // Non-existing fragment should return a 404 error
  test('returns 404 for non-existing fragment', async () => {
    await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(Buffer.from('This is a test fragment as a buffer: 41 chars'));

    const res = await request(app)
      .get('/v1/fragments/nonExistingId/info')
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toMatch(/not found/);
  });

  // Requesting a fragment when there is no fragment return a 404 error
  test('returns 404 for empty fragment list', async () => {
    const res = await request(app)
      .get('/v1/fragments/nonExistingId/info')
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toMatch(/not found/);
  });
});

//******* testing GET /v1/fragments/:id.EXT ( or without EXT)
//returns an existing fragment's DATA + CONVERSION INTO EXT if needed (currently from MD to HTML)
describe('GET /v1/fragments/:id.EXT (or without EXT)', () => {
  test('unauthenticated requests to get a fragment are denied', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(Buffer.from('This is a test fragment as a buffer: 41 chars'));
    const fragment = res.body.fragments[0];
    const fragmentId = fragment.id;

    await request(app).get(`/v1/fragments/${fragmentId}`).expect(401);
  });

  test('incorrect credentials to get a fragment are denied', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(Buffer.from('This is a test fragment as a buffer: 41 chars'));
    const fragment = res.body.fragments[0];
    const fragmentId = fragment.id;

    await request(app)
      .get(`/v1/fragments/${fragmentId}`)
      .auth('invalid@email.com', 'incorrect_password')
      .expect(401);
  });

  test('returns 404 for non-existing fragment', async () => {
    await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(Buffer.from('This is a test fragment as a buffer: 41 chars'));

    const res = await request(app)
      .get('/v1/fragments/nonExistingId')
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toMatch(/not found/);
  });

  test('returns 415 if requesting fragment in unsupported format', async () => {
    const res0 = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(Buffer.from('This is a test fragment 1'));
    const fragment = res0.body.fragments[0];
    const fragmentId = fragment.id;

    const res = await request(app)
      .get(`/v1/fragments/${fragmentId}.strangeExt`)
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(415);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toMatch(/Unsupported/);
  });

  // ===TEST GETTING ORIGINAL FRAGMENT DATA ========================================
  test('returns fragment in original format when NO EXTENSION is provided', async () => {
    const jsonData = { key: 'value', number: 123 };
    const res0 = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(jsonData));
    const fragmentId = res0.body.fragments[0].id;

    const res = await request(app)
      .get(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toEqual(jsonData);
  });

  //GET ORIGINAL: Authenticated users should get a specific fragment by ID with the ORIGINAL DATA

  // TXT (text/plain)
  // PLAIN TEXT FRAGMENT with CHARSET UTF-8  "text/plain; charset=utf-8"
  test('authenticated users can get the ORIGINAL as TXT with MANY CHARSETS', async () => {
    const resA = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain; charset=utf-8')
      .send(Buffer.from('This is a test plain text fragment with charset utf-8'));
    const fragmentA = resA.body.fragments[0];
    const fragmentIdA = fragmentA.id;

    // with charset=utf-8
    const resGET_A = await request(app)
      .get(`/v1/fragments/${fragmentIdA}`)
      .auth('user1@email.com', 'password1');
    expect(resGET_A.statusCode).toBe(200);
    expect(resGET_A.headers['content-type']).toMatch(/text\/plain/);
    expect(resGET_A.headers['content-type']).toMatch(/charset=utf-8/);
    expect(resGET_A.text).toBe('This is a test plain text fragment with charset utf-8');

    // ------------------------------
    const resB = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain; charset=iso-8859-1')
      .send(Buffer.from('This is a test plain text fragment with charset iso-8859-1'));
    const fragmentB = resB.body.fragments[0];
    const fragmentIdB = fragmentB.id;

    // with charset=iso-8859-1
    const resGET_B = await request(app)
      .get(`/v1/fragments/${fragmentIdB}`)
      .auth('user1@email.com', 'password1');
    expect(resGET_B.statusCode).toBe(200);
    expect(resGET_B.headers['content-type']).toMatch(/text\/plain/);
    expect(resGET_B.headers['content-type']).toMatch(/charset=iso-8859-1/);
    expect(resGET_B.text).toBe('This is a test plain text fragment with charset iso-8859-1');
  });

  // TXT (text/plain)
  test('authenticated users can get the ORIGINAL as TXT (text/plain) fragment with correct type', async () => {
    const res0 = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(Buffer.from('This is a test fragment 1'));
    const fragment = res0.body.fragments[0];
    const fragmentId = fragment.id;

    await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(Buffer.from('This is a test fragment 2'));

    // without .txt
    const res = await request(app)
      .get(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/plain/);
    expect(res.text).toBe('This is a test fragment 1');

    // with .txt
    const res2 = await request(app)
      .get(`/v1/fragments/${fragmentId}.txt`)
      .auth('user1@email.com', 'password1');
    expect(res2.statusCode).toBe(200);
    expect(res2.headers['content-type']).toMatch(/text\/plain/);
    expect(res2.text).toBe('This is a test fragment 1');
  });

  // MD (text/markdown)
  test('authenticated users can get the ORIGINAL as MARKDOWN (text/markdown)', async () => {
    const res0 = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/markdown')
      .send(Buffer.from('# This is a Markdown fragment'));
    const fragmentId = res0.body.fragments[0].id;

    // without .md
    const res = await request(app)
      .get(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/markdown/);
    expect(res.text).toBe('# This is a Markdown fragment');

    // with .md
    const res2 = await request(app)
      .get(`/v1/fragments/${fragmentId}.md`)
      .auth('user1@email.com', 'password1');
    expect(res2.statusCode).toBe(200);
    expect(res2.headers['content-type']).toMatch(/text\/markdown/);
    expect(res2.text).toBe('# This is a Markdown fragment');
  });

  //CSV (text/csv)
  test('authenticated users can get the ORIGINAL as CSV (text/csv)', async () => {
    const res0 = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/csv')
      .send(Buffer.from('name,age\nJohn,30\nDoe,25'));
    const fragmentId = res0.body.fragments[0].id;

    // without .csv
    const res = await request(app)
      .get(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.text).toBe('name,age\nJohn,30\nDoe,25');

    // with .csv
    const res2 = await request(app)
      .get(`/v1/fragments/${fragmentId}.csv`)
      .auth('user1@email.com', 'password1');
    expect(res2.statusCode).toBe(200);
    expect(res2.headers['content-type']).toMatch(/text\/csv/);
    expect(res2.text).toBe('name,age\nJohn,30\nDoe,25');
  });

  //JSON (application/json)
  test('authenticated users can get the ORIGINAL as JSON (application/json)', async () => {
    const jsonData = { key: 'value', number: 123 };
    const res0 = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(jsonData));
    const fragmentId = res0.body.fragments[0].id;

    // without .json
    const res = await request(app)
      .get(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toEqual(jsonData);

    // with .json
    const res2 = await request(app)
      .get(`/v1/fragments/${fragmentId}.json`)
      .auth('user1@email.com', 'password1');
    expect(res2.statusCode).toBe(200);
    expect(res2.headers['content-type']).toMatch(/application\/json/);
    expect(res2.body).toEqual(jsonData);
  });

  //HTML (text/html)
  test('authenticated users can get the ORIGINAL as HTML (text/html)', async () => {
    const res0 = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/html')
      .send(Buffer.from('<p>This is an HTML fragment</p>'));
    const fragmentId = res0.body.fragments[0].id;

    // without .html
    const res = await request(app)
      .get(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.text).toBe('<p>This is an HTML fragment</p>');

    // with .html
    const res2 = await request(app)
      .get(`/v1/fragments/${fragmentId}.html`)
      .auth('user1@email.com', 'password1');
    expect(res2.statusCode).toBe(200);
    expect(res2.headers['content-type']).toMatch(/text\/html/);
    expect(res2.text).toBe('<p>This is an HTML fragment</p>');
  });

  //PNG (image/png)
  test('authenticated users can get the ORIGINAL as PNG (image/png)', async () => {
    //TEST INPUTS:
    let filename = 'file.png';
    let MIMEtype = 'image/png';
    let EXT = 'PNG';

    // Create an IMAGE fragment
    const pathToImage = path.join(__dirname, '..', 'testingFiles', filename);
    const imageBuffer = fs.readFileSync(pathToImage); // Read the image file into a BUFFER
    //---POST-------------------------------------------
    const res0 = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', MIMEtype)
      .send(imageBuffer);

    const fragmentId = res0.body.fragments[0].id;

    //---GET without EXT-------------------------------
    const GETres1 = await request(app)
      .get(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1')
      .responseType('blob');

    expect(GETres1.statusCode).toBe(200);
    expect(GETres1.headers['content-type']).toBe(MIMEtype);
    expect(Buffer.isBuffer(GETres1.body)).toBe(true);
    expect(GETres1.body.length).toBeGreaterThan(0);

    // use SHARP to validate the real metadata of the image
    try {
      const receivedMetadata = await sharp(GETres1.body).metadata();
      const originalMetadata = await sharp(imageBuffer).metadata();
      expect(receivedMetadata).toEqual(originalMetadata);
    } catch (err) {
      logger.error({ err }, `Testing ${EXT}: GET ORIGINAL: Error in sharp() for metadata`);
      throw err;
    }

    // Validate the content matches the original
    const receivedBuffer1 = Buffer.from(GETres1.body);
    const originalBuffer1 = imageBuffer;
    expect(receivedBuffer1.equals(originalBuffer1)).toBe(true);

    //---GET with ORIGINAL EXT-------------------------------
    const GETres2 = await request(app)
      .get(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1')
      .responseType('blob');

    expect(GETres2.statusCode).toBe(200);
    expect(GETres2.headers['content-type']).toBe(MIMEtype);
    expect(Buffer.isBuffer(GETres2.body)).toBe(true);
    expect(GETres2.body.length).toBeGreaterThan(0);

    // use SHARP to validate the real metadata of the image
    try {
      const receivedMetadata = await sharp(GETres2.body).metadata();
      const originalMetadata = await sharp(imageBuffer).metadata();
      expect(receivedMetadata).toEqual(originalMetadata);
    } catch (err) {
      logger.error({ err }, `Testing ${EXT}: GET ORIGINAL: Error in sharp() for metadata`);
      throw err;
    }

    // Validate the content matches the original
    const receivedBuffer2 = Buffer.from(GETres2.body);
    const originalBuffer2 = imageBuffer;
    expect(receivedBuffer2.equals(originalBuffer2)).toBe(true);
  });

  //JPG (image/jpeg)
  test('authenticated users can get the ORIGINAL as JPG (image/jpeg)', async () => {
    //TEST INPUTS:
    let filename = 'file.jpg';
    let MIMEtype = 'image/jpeg';
    let EXT = 'JPG';

    const pathToImage = path.join(__dirname, '..', 'testingFiles', filename);
    const imageBuffer = fs.readFileSync(pathToImage);
    //---POST-------------------------------------------
    const res0 = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', MIMEtype)
      .send(imageBuffer);

    const fragmentId = res0.body.fragments[0].id;

    //---GET without EXT-------------------------------
    const GETres1 = await request(app)
      .get(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1')
      .responseType('blob');

    expect(GETres1.statusCode).toBe(200);
    expect(GETres1.headers['content-type']).toBe(MIMEtype);
    expect(Buffer.isBuffer(GETres1.body)).toBe(true);
    expect(GETres1.body.length).toBeGreaterThan(0);

    // use SHARP to validate the real metadata of the image
    try {
      const receivedMetadata = await sharp(GETres1.body).metadata();
      const originalMetadata = await sharp(imageBuffer).metadata();
      expect(receivedMetadata).toEqual(originalMetadata);
    } catch (err) {
      logger.error({ err }, `Testing ${EXT}: GET ORIGINAL: Error in sharp() for metadata`);
      throw err;
    }

    const receivedBuffer1 = Buffer.from(GETres1.body);
    const originalBuffer1 = imageBuffer;
    expect(receivedBuffer1.equals(originalBuffer1)).toBe(true);

    //---GET with ORIGINAL EXT-------------------------------
    const GETres2 = await request(app)
      .get(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1')
      .responseType('blob');

    expect(GETres2.statusCode).toBe(200);
    expect(GETres2.headers['content-type']).toBe(MIMEtype);
    expect(Buffer.isBuffer(GETres2.body)).toBe(true);
    expect(GETres2.body.length).toBeGreaterThan(0);

    // use SHARP to validate the real metadata of the image
    try {
      const receivedMetadata = await sharp(GETres2.body).metadata();
      const originalMetadata = await sharp(imageBuffer).metadata();
      expect(receivedMetadata).toEqual(originalMetadata);
    } catch (err) {
      logger.error({ err }, `Testing ${EXT}: GET ORIGINAL: Error in sharp() for metadata`);
      throw err;
    }

    // Validate the content matches the original
    const receivedBuffer2 = Buffer.from(GETres2.body);
    const originalBuffer2 = imageBuffer;
    expect(receivedBuffer2.equals(originalBuffer2)).toBe(true);
  });

  //WEBP (image/webp)
  test('authenticated users can get the ORIGINAL as WEBP (image/webp)', async () => {
    //TEST INPUTS:
    let filename = 'file.webp';
    let MIMEtype = 'image/webp';
    let EXT = 'WEBP';

    const pathToImage = path.join(__dirname, '..', 'testingFiles', filename);
    const imageBuffer = fs.readFileSync(pathToImage);
    //---POST-------------------------------------------
    const res0 = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', MIMEtype)
      .send(imageBuffer);

    const fragmentId = res0.body.fragments[0].id;

    //---GET without EXT-------------------------------
    const GETres1 = await request(app)
      .get(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1')
      .responseType('blob');

    expect(GETres1.statusCode).toBe(200);
    expect(GETres1.headers['content-type']).toBe(MIMEtype);
    expect(Buffer.isBuffer(GETres1.body)).toBe(true);
    expect(GETres1.body.length).toBeGreaterThan(0);

    // use SHARP to validate the real metadata of the image
    try {
      const receivedMetadata = await sharp(GETres1.body).metadata();
      const originalMetadata = await sharp(imageBuffer).metadata();
      expect(receivedMetadata).toEqual(originalMetadata);
    } catch (err) {
      logger.error({ err }, `Testing ${EXT}: GET ORIGINAL: Error in sharp() for metadata`);
      throw err;
    }

    // Validate the content matches the original
    const receivedBuffer1 = Buffer.from(GETres1.body);
    const originalBuffer1 = imageBuffer;
    expect(receivedBuffer1.equals(originalBuffer1)).toBe(true);

    //---GET with ORIGINAL EXT-------------------------------
    const GETres2 = await request(app)
      .get(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1')
      .responseType('blob');

    expect(GETres2.statusCode).toBe(200);
    expect(GETres2.headers['content-type']).toBe(MIMEtype);
    expect(Buffer.isBuffer(GETres2.body)).toBe(true);
    expect(GETres2.body.length).toBeGreaterThan(0);

    // use SHARP to validate the real metadata of the image
    try {
      const receivedMetadata = await sharp(GETres2.body).metadata();
      const originalMetadata = await sharp(imageBuffer).metadata();
      expect(receivedMetadata).toEqual(originalMetadata);
    } catch (err) {
      logger.error({ err }, `Testing ${EXT}: GET ORIGINAL: Error in sharp() for metadata`);
      throw err;
    }

    // Validate the content matches the original
    const receivedBuffer2 = Buffer.from(GETres2.body);
    const originalBuffer2 = imageBuffer;
    expect(receivedBuffer2.equals(originalBuffer2)).toBe(true);
  });

  //GIF (image/gif)
  test('authenticated users can get the ORIGINAL as GIF (image/gif)', async () => {
    //TEST INPUTS:
    let filename = 'file.gif';
    let MIMEtype = 'image/gif';
    let EXT = 'GIF';

    const pathToImage = path.join(__dirname, '..', 'testingFiles', filename);
    const imageBuffer = fs.readFileSync(pathToImage);
    //---POST-------------------------------------------
    const res0 = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', MIMEtype)
      .send(imageBuffer);

    const fragmentId = res0.body.fragments[0].id;

    //---GET without EXT-------------------------------
    const GETres1 = await request(app)
      .get(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1')
      .responseType('blob');

    expect(GETres1.statusCode).toBe(200);
    expect(GETres1.headers['content-type']).toBe(MIMEtype);
    expect(Buffer.isBuffer(GETres1.body)).toBe(true);
    expect(GETres1.body.length).toBeGreaterThan(0);

    // use SHARP to validate the real metadata of the image
    try {
      const receivedMetadata = await sharp(GETres1.body).metadata();
      const originalMetadata = await sharp(imageBuffer).metadata();
      expect(receivedMetadata).toEqual(originalMetadata);
    } catch (err) {
      logger.error({ err }, `Testing ${EXT}: GET ORIGINAL: Error in sharp() for metadata`);
      throw err;
    }

    // Validate the content matches the original
    const receivedBuffer1 = Buffer.from(GETres1.body);
    const originalBuffer1 = imageBuffer;
    expect(receivedBuffer1.equals(originalBuffer1)).toBe(true);

    //---GET with ORIGINAL EXT-------------------------------
    const GETres2 = await request(app)
      .get(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1')
      .responseType('blob');

    expect(GETres2.statusCode).toBe(200);
    expect(GETres2.headers['content-type']).toBe(MIMEtype);
    expect(Buffer.isBuffer(GETres2.body)).toBe(true);
    expect(GETres2.body.length).toBeGreaterThan(0);

    // use SHARP to validate the real metadata of the image
    try {
      const receivedMetadata = await sharp(GETres2.body).metadata();
      const originalMetadata = await sharp(imageBuffer).metadata();
      expect(receivedMetadata).toEqual(originalMetadata);
    } catch (err) {
      logger.error({ err }, `Testing ${EXT}: GET ORIGINAL: Error in sharp() for metadata`);
      throw err;
    }

    // Validate the content matches the original
    const receivedBuffer2 = Buffer.from(GETres2.body);
    const originalBuffer2 = imageBuffer;
    expect(receivedBuffer2.equals(originalBuffer2)).toBe(true);
  });

  //AVIF (image/avif)
  test('authenticated users can get the ORIGINAL as AVIF (image/avif)', async () => {
    //TEST INPUTS:
    let filename = 'file.avif';
    let MIMEtype = 'image/avif';
    let EXT = 'AVIF';

    const pathToImage = path.join(__dirname, '..', 'testingFiles', filename);
    const imageBuffer = fs.readFileSync(pathToImage);
    //---POST-------------------------------------------
    const res0 = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', MIMEtype)
      .send(imageBuffer);

    const fragmentId = res0.body.fragments[0].id;

    //---GET without EXT-------------------------------
    const GETres1 = await request(app)
      .get(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1')
      .responseType('blob');

    expect(GETres1.statusCode).toBe(200);
    expect(GETres1.headers['content-type']).toBe(MIMEtype);
    expect(Buffer.isBuffer(GETres1.body)).toBe(true);
    expect(GETres1.body.length).toBeGreaterThan(0);

    // use SHARP to validate the real metadata of the image
    try {
      const receivedMetadata = await sharp(GETres1.body).metadata();
      const originalMetadata = await sharp(imageBuffer).metadata();
      expect(receivedMetadata).toEqual(originalMetadata);
    } catch (err) {
      logger.error({ err }, `Testing ${EXT}: GET ORIGINAL: Error in sharp() for metadata`);
      throw err;
    }

    // Validate the content matches the original
    const receivedBuffer1 = Buffer.from(GETres1.body);
    const originalBuffer1 = imageBuffer;
    expect(receivedBuffer1.equals(originalBuffer1)).toBe(true);

    //---GET with ORIGINAL EXT-------------------------------
    const GETres2 = await request(app)
      .get(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1')
      .responseType('blob');

    expect(GETres2.statusCode).toBe(200);
    expect(GETres2.headers['content-type']).toBe(MIMEtype);
    expect(Buffer.isBuffer(GETres2.body)).toBe(true);
    expect(GETres2.body.length).toBeGreaterThan(0);

    // use SHARP to validate the real metadata of the image
    try {
      const receivedMetadata = await sharp(GETres2.body).metadata();
      const originalMetadata = await sharp(imageBuffer).metadata();
      expect(receivedMetadata).toEqual(originalMetadata);
    } catch (err) {
      logger.error({ err }, `Testing ${EXT}: GET ORIGINAL: Error in sharp() for metadata`);
      throw err;
    }

    // Validate the content matches the original
    const receivedBuffer2 = Buffer.from(GETres2.body);
    const originalBuffer2 = imageBuffer;
    expect(receivedBuffer2.equals(originalBuffer2)).toBe(true);
  });

  // ===TEST GETTING CONVERTED FRAGMENT DATA ========================================
  // Authenticated users should get a specific fragment by ID AFTER CONVERSION

  //TESTING UNSUPPORTED CONVERSION: from MD to JSON
  test('returns 415 if requesting fragment in unsupported format for Conversion', async () => {
    const res0 = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/markdown')
      .send(Buffer.from('# Markdown Test'));

    const fragment = res0.body.fragments[0];
    const fragmentId = fragment.id;

    const res = await request(app)
      .get(`/v1/fragments/${fragmentId}.json`)
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(415);
    expect(res.body.status).toBe('error');
  });

  // MD --> HTML
  test('ORIGINAL MD (text/markdown) can be CONVERTED to HTML (text/html)', async () => {
    //TEST INPUTS:
    let MIMEtype = 'text/markdown';
    let contentString = '# Markdown Test';
    let newUrlExt = 'html';
    let newMIMEtype = 'text/html';
    let newContentString = '<h1>Markdown Test</h1>';

    const res0 = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', MIMEtype)
      .send(Buffer.from(contentString));

    const fragment = res0.body.fragments[0];
    const fragmentId = fragment.id;

    const res = await request(app)
      .get(`/v1/fragments/${fragmentId}.${newUrlExt}`)
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain(newMIMEtype);
    expect(res.text).toContain(newContentString);
  });

  // MD --> TXT
  test('ORIGINAL MD (text/markdown) can be CONVERTED to TXT (text/plain)', async () => {
    //TEST INPUTS:
    let MIMEtype = 'text/markdown';
    let contentString = '# Markdown Test';
    let newUrlExt = 'txt';
    let newMIMEtype = 'text/plain';
    let newContentString = 'Markdown Test';

    const res0 = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', MIMEtype)
      .send(Buffer.from(contentString));

    const fragment = res0.body.fragments[0];
    const fragmentId = fragment.id;

    const res = await request(app)
      .get(`/v1/fragments/${fragmentId}.${newUrlExt}`)
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain(newMIMEtype);
    expect(res.text).toContain(newContentString);
  });

  // HTML --> TXT
  test('ORIGINAL HTML (text/html) can be CONVERTED to TXT (text/plain)', async () => {
    //TEST INPUTS:
    let MIMEtype = 'text/html';
    let contentString = '<h1>HTML Test</h1>';
    let newUrlExt = 'txt';
    let newMIMEtype = 'text/plain';
    let newContentString = 'HTML Test';

    const res0 = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', MIMEtype)
      .send(Buffer.from(contentString));

    const fragment = res0.body.fragments[0];
    const fragmentId = fragment.id;

    const res = await request(app)
      .get(`/v1/fragments/${fragmentId}.${newUrlExt}`)
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain(newMIMEtype);
    expect(res.text).toContain(newContentString);
  });

  // CSV --> JSON
  test('ORIGINAL CSV (text/csv) can be CONVERTED to JSON (application/json)', async () => {
    //TEST INPUTS:
    let MIMEtype = 'text/csv';
    let contentString = 'name,age\nJohn,30\nDoe,25';
    let newUrlExt = 'json';
    let newMIMEtype = 'application/json';
    let newContentString = '[{"name":"John","age":"30"},{"name":"Doe","age":"25"}]';

    const res0 = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', MIMEtype)
      .send(Buffer.from(contentString));

    const fragment = res0.body.fragments[0];
    const fragmentId = fragment.id;

    const res = await request(app)
      .get(`/v1/fragments/${fragmentId}.${newUrlExt}`)
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain(newMIMEtype);
    expect(res.text).toContain(newContentString);
  });

  // CSV --> TXT
  test('ORIGINAL CSV (text/csv) can be CONVERTED to TXT (text/plain)', async () => {
    //TEST INPUTS:
    let MIMEtype = 'text/csv';
    let contentString = 'name,age\nJohn,30\nDoe,25';
    let newUrlExt = 'txt';
    let newMIMEtype = 'text/plain';
    let newContentString = 'name,age\nJohn,30\nDoe,25';

    const res0 = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', MIMEtype)
      .send(Buffer.from(contentString));

    const fragment = res0.body.fragments[0];
    const fragmentId = fragment.id;

    const res = await request(app)
      .get(`/v1/fragments/${fragmentId}.${newUrlExt}`)
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain(newMIMEtype);
    expect(res.text).toContain(newContentString);
  });

  // JSON --> TXT
  test('ORIGINAL JSON (application/json) can be CONVERTED to TXT (text/plain)', async () => {
    //TEST INPUTS:
    let MIMEtype = 'application/json';
    let contentString = '{"name":"John","age":30}';
    let newUrlExt = 'txt';
    let newMIMEtype = 'text/plain';
    let newContentString = '{"name":"John","age":30}';

    const res0 = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', MIMEtype)
      .send(Buffer.from(contentString));

    const fragment = res0.body.fragments[0];
    const fragmentId = fragment.id;

    const res = await request(app)
      .get(`/v1/fragments/${fragmentId}.${newUrlExt}`)
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain(newMIMEtype);
    expect(res.text).toContain(newContentString);
  });

  // JSON --> YAML
  test('ORIGINAL JSON (application/json) can be CONVERTED to YAML (application/yaml)', async () => {
    //TEST INPUTS:
    let MIMEtype = 'application/json';
    let contentString = '{"name":"John","age":30}';
    let newUrlExt = 'yaml';
    let newMIMEtype = 'application/yaml';
    let newContentString = 'name: John\nage: 30';

    const res0 = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', MIMEtype)
      .send(Buffer.from(contentString));

    const fragment = res0.body.fragments[0];
    const fragmentId = fragment.id;

    const res = await request(app)
      .get(`/v1/fragments/${fragmentId}.${newUrlExt}`)
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain(newMIMEtype);
    expect(res.text).toContain(newContentString);
  });

  // YAML --> TXT
  test('ORIGINAL YAML (text/yaml) can be CONVERTED to TXT (text/plain)', async () => {
    //TEST INPUTS:
    let MIMEtype = 'application/yaml';
    let contentString = 'name: John\nage: 30\n';
    let newUrlExt = 'txt';
    let newMIMEtype = 'text/plain';
    let newContentString = 'name: John\nage: 30\n';

    const res0 = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', MIMEtype)
      .send(Buffer.from(contentString));

    const fragment = res0.body.fragments[0];
    const fragmentId = fragment.id;

    const res = await request(app)
      .get(`/v1/fragments/${fragmentId}.${newUrlExt}`)
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain(newMIMEtype);
    expect(res.text).toContain(newContentString);
  });

  //----IMAGE CONVERSIONS------------------------------------------------------------
  // PNG --> JPG
  test('ORIGINAL PNG (image/png) can be CONVERTED to JPG (image/jpeg)', async () => {
    //TEST INPUTS:
    let filename = 'file.png';
    let MIMEtype = 'image/png';
    let newUrlExt = 'jpg';
    let newMIMEtype = 'image/jpeg';
    let EXT = 'JPG';

    const pathToImage = path.join(__dirname, '..', 'testingFiles', filename);
    const imageBuffer = fs.readFileSync(pathToImage);

    try {
      // Directly convert the original image to new format
      let convertedImageBuffer = await sharp(imageBuffer).jpeg().toBuffer();

      //---POST-------------------------------------------
      const res0 = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', MIMEtype)
        .send(imageBuffer);

      // Extract the fragment ID from the response
      const fragmentId = res0.body.fragments[0].id;

      //---GET with NEW EXT-------------------------------
      const GETres1 = await request(app)
        .get(`/v1/fragments/${fragmentId}.${newUrlExt}`)
        .auth('user1@email.com', 'password1')
        .responseType('blob');

      expect(GETres1.statusCode).toBe(200);
      expect(GETres1.headers['content-type']).toBe(newMIMEtype);
      expect(Buffer.isBuffer(GETres1.body)).toBe(true);
      expect(GETres1.body.length).toBeGreaterThan(0);

      // use SHARP to validate the real metadata of the image
      const receivedMetadata = await sharp(GETres1.body).metadata();
      const convertedOriginalMetadata = await sharp(convertedImageBuffer).metadata();
      expect(receivedMetadata).toEqual(convertedOriginalMetadata);

      // Validate the content matches the original directly converted
      const receivedBuffer1 = Buffer.from(GETres1.body);
      expect(receivedBuffer1.equals(convertedImageBuffer)).toBe(true);
    } catch (err) {
      logger.error({ err }, `Testing ${EXT}: GET ORIGINAL: Error with sharp()`);
      throw err;
    }
  });

  // JPG --> WEBP
  test('ORIGINAL JPG (image/jpeg) can be CONVERTED to WEBP (image/webp)', async () => {
    //TEST INPUTS:
    let filename = 'file.jpg';
    let MIMEtype = 'image/jpeg';
    let newUrlExt = 'webp';
    let newMIMEtype = 'image/webp';
    let EXT = 'PNG';

    const pathToImage = path.join(__dirname, '..', 'testingFiles', filename);
    const imageBuffer = fs.readFileSync(pathToImage);

    try {
      // Directly convert the original image to new format
      let convertedImageBuffer = await sharp(imageBuffer).webp().toBuffer();

      //---POST-------------------------------------------
      const res0 = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', MIMEtype)
        .send(imageBuffer);

      const fragmentId = res0.body.fragments[0].id;

      //---GET with NEW EXT-------------------------------
      const GETres1 = await request(app)
        .get(`/v1/fragments/${fragmentId}.${newUrlExt}`)
        .auth('user1@email.com', 'password1')
        .responseType('blob');

      expect(GETres1.statusCode).toBe(200);
      expect(GETres1.headers['content-type']).toBe(newMIMEtype);
      expect(Buffer.isBuffer(GETres1.body)).toBe(true);
      expect(GETres1.body.length).toBeGreaterThan(0);

      // use SHARP to validate the real metadata of the image
      const receivedMetadata = await sharp(GETres1.body).metadata();
      const convertedOriginalMetadata = await sharp(convertedImageBuffer).metadata();
      expect(receivedMetadata).toEqual(convertedOriginalMetadata);

      // Validate the content matches the original directly converted
      const receivedBuffer1 = Buffer.from(GETres1.body);
      expect(receivedBuffer1.equals(convertedImageBuffer)).toBe(true);
    } catch (err) {
      logger.error({ err }, `Testing ${EXT}: GET ORIGINAL: Error with sharp()`);
      throw err;
    }
  });

  // WEBP --> AVIF
  test('ORIGINAL WEBP (image/webp) can be CONVERTED to AVIF (image/avif)', async () => {
    //TEST INPUTS:
    let filename = 'file.webp';
    let MIMEtype = 'image/webp';
    let newUrlExt = 'avif';
    let newMIMEtype = 'image/avif';
    let EXT = 'AVIF';

    const pathToImage = path.join(__dirname, '..', 'testingFiles', filename);
    const imageBuffer = fs.readFileSync(pathToImage);

    try {
      // Directly convert the original image to new format
      let convertedImageBuffer = await sharp(imageBuffer).avif().toBuffer();

      //---POST-------------------------------------------
      const res0 = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', MIMEtype)
        .send(imageBuffer);

      const fragmentId = res0.body.fragments[0].id;

      //---GET with NEW EXT-------------------------------
      const GETres1 = await request(app)
        .get(`/v1/fragments/${fragmentId}.${newUrlExt}`)
        .auth('user1@email.com', 'password1')
        .responseType('blob');

      expect(GETres1.statusCode).toBe(200);
      expect(GETres1.headers['content-type']).toBe(newMIMEtype);
      expect(Buffer.isBuffer(GETres1.body)).toBe(true);
      expect(GETres1.body.length).toBeGreaterThan(0);

      // use SHARP to validate the real metadata of the image
      const receivedMetadata = await sharp(GETres1.body).metadata();
      const convertedOriginalMetadata = await sharp(convertedImageBuffer).metadata();
      expect(receivedMetadata).toEqual(convertedOriginalMetadata);

      // Validate the content matches the original directly converted
      const receivedBuffer1 = Buffer.from(GETres1.body);
      expect(receivedBuffer1.equals(convertedImageBuffer)).toBe(true);
    } catch (err) {
      logger.error({ err }, `Testing ${EXT}: GET ORIGINAL: Error with sharp()`);
      throw err;
    }
  });

  // AVIF --> GIF
  test('ORIGINAL AVIF (image/avif) can be CONVERTED to GIF (image/gif)', async () => {
    //TEST INPUTS:
    let filename = 'file.avif';
    let MIMEtype = 'image/avif';
    let newUrlExt = 'gif';
    let newMIMEtype = 'image/gif';
    let EXT = 'GIF';

    const pathToImage = path.join(__dirname, '..', 'testingFiles', filename);
    const imageBuffer = fs.readFileSync(pathToImage);

    try {
      // Directly convert the original image to new format
      let convertedImageBuffer = await sharp(imageBuffer).gif().toBuffer();

      //---POST-------------------------------------------
      const res0 = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', MIMEtype)
        .send(imageBuffer);

      const fragmentId = res0.body.fragments[0].id;

      //---GET with NEW EXT-------------------------------
      const GETres1 = await request(app)
        .get(`/v1/fragments/${fragmentId}.${newUrlExt}`)
        .auth('user1@email.com', 'password1')
        .responseType('blob');

      expect(GETres1.statusCode).toBe(200);
      expect(GETres1.headers['content-type']).toBe(newMIMEtype);
      expect(Buffer.isBuffer(GETres1.body)).toBe(true);
      expect(GETres1.body.length).toBeGreaterThan(0);

      // use SHARP to validate the real metadata of the image
      const receivedMetadata = await sharp(GETres1.body).metadata();
      const convertedOriginalMetadata = await sharp(convertedImageBuffer).metadata();
      expect(receivedMetadata).toEqual(convertedOriginalMetadata);

      // Validate the content matches the original directly converted
      const receivedBuffer1 = Buffer.from(GETres1.body);
      expect(receivedBuffer1.equals(convertedImageBuffer)).toBe(true);
    } catch (err) {
      logger.error({ err }, `Testing ${EXT}: GET ORIGINAL: Error with sharp()`);
      throw err;
    }
  });

  // GIF --> PNG
  test('ORIGINAL GIF (image/gif) can be CONVERTED to PNG (image/png)', async () => {
    //TEST INPUTS:
    let filename = 'file.gif';
    let MIMEtype = 'image/gif';
    let newUrlExt = 'png';
    let newMIMEtype = 'image/png';
    let EXT = 'PNG';

    const pathToImage = path.join(__dirname, '..', 'testingFiles', filename);
    const imageBuffer = fs.readFileSync(pathToImage);

    try {
      // Directly convert the original image to new format
      let convertedImageBuffer = await sharp(imageBuffer).png().toBuffer();

      //---POST-------------------------------------------
      const res0 = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', MIMEtype)
        .send(imageBuffer);

      const fragmentId = res0.body.fragments[0].id;

      //---GET with NEW EXT-------------------------------
      const GETres1 = await request(app)
        .get(`/v1/fragments/${fragmentId}.${newUrlExt}`)
        .auth('user1@email.com', 'password1')
        .responseType('blob');

      expect(GETres1.statusCode).toBe(200);
      expect(GETres1.headers['content-type']).toBe(newMIMEtype);
      expect(Buffer.isBuffer(GETres1.body)).toBe(true);
      expect(GETres1.body.length).toBeGreaterThan(0);

      // use SHARP to validate the real metadata of the image
      const receivedMetadata = await sharp(GETres1.body).metadata();
      const convertedOriginalMetadata = await sharp(convertedImageBuffer).metadata();
      expect(receivedMetadata).toEqual(convertedOriginalMetadata);

      // Validate the content matches the original directly converted
      const receivedBuffer1 = Buffer.from(GETres1.body);
      expect(receivedBuffer1.equals(convertedImageBuffer)).toBe(true);
    } catch (err) {
      logger.error({ err }, `Testing ${EXT}: GET ORIGINAL: Error with sharp()`);
      throw err;
    }
  });
});
