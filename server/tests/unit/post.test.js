// tests/unit/post.test.js

// *** This Test file is testing the ROUTE: POST /v1/fragments ***

const request = require('supertest');

const app = require('../../src/app');
const hash = require('../../src/hash');
const fs = require('fs');
const path = require('path');

describe('POST /v1/fragments', () => {
  test('unauthenticated requests are denied', () => request(app).post('/v1/fragments').expect(401));

  test('incorrect credentials are denied', () =>
    request(app).post('/v1/fragments').auth('invalid@email.com', 'incorrect_password').expect(401));

  test('authenticated users can create a plain text fragment with charset=utf-8', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain; charset=utf-8')
      .send(Buffer.from('This is a test plain text fragment with charset utf-8'));

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragments).toBeDefined();

    const fragment = res.body.fragments[0];
    expect(fragment.ownerId).toBe(hash('user1@email.com'));
    expect(fragment).toHaveProperty('id');
    expect(fragment).toHaveProperty('created');
    expect(fragment).toHaveProperty('updated');
    expect(fragment.type).toBe('text/plain; charset=utf-8');
    expect(fragment.size).toBeGreaterThan(1);
  });

  test('authenticated users can create a plain text fragment with charset=iso-8859-1', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain; charset=iso-8859-1')
      .send(Buffer.from('This is a test plain text fragment with charset iso-8859-1'));

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragments).toBeDefined();

    const fragment = res.body.fragments[0];
    expect(fragment.ownerId).toBe(hash('user1@email.com'));
    expect(fragment).toHaveProperty('id');
    expect(fragment).toHaveProperty('created');
    expect(fragment).toHaveProperty('updated');
    expect(fragment.type).toBe('text/plain; charset=iso-8859-1');
    expect(fragment.size).toBeGreaterThan(1);
  });

  // PLAIN TEXT FRAGMENT
  test('authenticated users can create a plain text fragment with correct content', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(Buffer.from('This is a test fragment as a buffer: 45 chars'));
    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragments).toBeDefined();
    const fragments = res.body.fragments[0];
    expect(fragments.ownerId).toBe(hash('user1@email.com'));
    expect(fragments).toHaveProperty('id');
    expect(fragments).toHaveProperty('created');
    expect(fragments).toHaveProperty('updated');
    expect(fragments.type).toBe('text/plain');
    expect(fragments.size).toBeGreaterThan(1);
  });

  // MARKDOWN FRAGMENT
  test('authenticated users can create a Markdown fragment', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/markdown')
      .send(Buffer.from('# Markdown Header\nSome **bold** text.'));
    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    const fragment = res.body.fragments[0];
    expect(fragment.type).toBe('text/markdown');
    expect(fragment.size).toBeGreaterThan(1);
  });

  // CSV FRAGMENT
  test('authenticated users can create a CSV fragment', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/csv')
      .send(Buffer.from('name,age\nAlice,30\nBob,25'));
    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    const fragment = res.body.fragments[0];
    expect(fragment.type).toBe('text/csv');
    expect(fragment.size).toBeGreaterThan(1);
  });

  // JSON FRAGMENT
  test('authenticated users can create a JSON fragment', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'application/json')
      .send(Buffer.from(JSON.stringify({ name: 'Alice', age: 30 })));
    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    const fragment = res.body.fragments[0];
    expect(fragment.type).toBe('application/json');
    expect(fragment.size).toBeGreaterThan(1);
  });

  //HTML FRAGMENT
  test('authenticated users can create an HTML fragment', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/html')
      .send(Buffer.from('<h1>Hello, World!</h1>'));
    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    const fragment = res.body.fragments[0];
    expect(fragment.type).toBe('text/html');
    expect(fragment.size).toBeGreaterThan(1);
  });

  //----POST IMAGE------------------------------------------------------------
  //PNG (image/png)
  test('authenticated users can create a PNG image fragment', async () => {
    //TEST INPUTS:
    let filename = 'file.png';
    let MIMEtype = 'image/png';

    const pathToImage = path.join(__dirname, '..', 'testingFiles', filename);
    const imageBuffer = fs.readFileSync(pathToImage);
    //---POST-------------------------------------------
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', MIMEtype)
      .send(imageBuffer);
    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    const fragment = res.body.fragments[0];
    expect(fragment.type).toBe(MIMEtype);
    expect(fragment.size).toBeGreaterThan(11);
  });

  //JPEG (image/jpeg)
  test('authenticated users can create a JPEG image fragment', async () => {
    //TEST INPUTS:
    let filename = 'file.jpg';
    let MIMEtype = 'image/jpeg';

    const pathToImage = path.join(__dirname, '..', 'testingFiles', filename);
    const imageBuffer = fs.readFileSync(pathToImage);
    //---POST-------------------------------------------
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', MIMEtype)
      .send(imageBuffer);
    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    const fragment = res.body.fragments[0];
    expect(fragment.type).toBe(MIMEtype);
    expect(fragment.size).toBeGreaterThan(11);
  });

  //WEBP (image/webp)
  test('authenticated users can create a WEBP image fragment', async () => {
    //TEST INPUTS:
    let filename = 'file.webp';
    let MIMEtype = 'image/webp';

    const pathToImage = path.join(__dirname, '..', 'testingFiles', filename);
    const imageBuffer = fs.readFileSync(pathToImage);
    //---POST-------------------------------------------
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', MIMEtype)
      .send(imageBuffer);
    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    const fragment = res.body.fragments[0];
    expect(fragment.type).toBe(MIMEtype);
    expect(fragment.size).toBeGreaterThan(11);
  });

  //AVIF (image/avif)
  test('authenticated users can create an AVIF image fragment', async () => {
    //TEST INPUTS:
    let filename = 'file.avif';
    let MIMEtype = 'image/avif';

    const pathToImage = path.join(__dirname, '..', 'testingFiles', filename);
    const imageBuffer = fs.readFileSync(pathToImage);
    //---POST-------------------------------------------
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', MIMEtype)
      .send(imageBuffer);
    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    const fragment = res.body.fragments[0];
    expect(fragment.type).toBe(MIMEtype);
    expect(fragment.size).toBeGreaterThan(11);
  });

  //GIF (image/gif)
  test('authenticated users can create a GIF image fragment', async () => {
    //TEST INPUTS:
    let filename = 'file.gif';
    let MIMEtype = 'image/gif';

    const pathToImage = path.join(__dirname, '..', 'testingFiles', filename);
    const imageBuffer = fs.readFileSync(pathToImage);
    //---POST-------------------------------------------
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', MIMEtype)
      .send(imageBuffer);
    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    const fragment = res.body.fragments[0];
    expect(fragment.type).toBe(MIMEtype);
    expect(fragment.size).toBeGreaterThan(11);
  });

  // ==TESTING LOCATION HEADER====================================
  test('POST response includes a Location header', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(Buffer.from('Fragment with location header'));
    expect(res.statusCode).toBe(201);
    expect(res.headers.location).toMatch(`/v1/fragments/${res.body.fragments[0].id}`);
  });

  // ==TESTING CONTENT-TYPE====================================
  test('returns 400 Bad Request when content type is not supported', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'application/unsupported')
      .send(Buffer.from('Invalid content type'));
    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe('error');
  });

  // ==TESTING ERROR SERVER====================================
  test('returns 500-Internal Server Error when Content-Type is missing', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .send();
    expect(res.statusCode).toBe(500);
    expect(res.body.status).toBe('error');
  });
});
