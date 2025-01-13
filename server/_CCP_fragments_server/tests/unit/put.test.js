// tests/unit/put.test.js

// *** This Test file is testing the ROUTE: PUT /v1/fragments/:id ***

const request = require('supertest');

const app = require('../../src/app');
const fs = require('fs');
const path = require('path');

describe('PUT /v1/fragments/:id', () => {
  test('authenticated users cannot update a fragment with a different content type', async () => {
    const res0 = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/markdown')
      .send(Buffer.from('# This is a Markdown fragment'));

    const fragmentId = res0.body.fragments[0].id;

    const res = await request(app)
      .put(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'application/json')
      .send(Buffer.from('{"key": "value"}'));

    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe('error');
  });

  test('authenticated users cannot update a fragment that does not belong to them', async () => {
    const res0 = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/markdown')
      .send(Buffer.from('# This is a Markdown fragment'));

    const fragmentId = res0.body.fragments[0].id;

    const res = await request(app)
      .put(`/v1/fragments/${fragmentId}`)
      .auth('user2@email.com', 'password2')
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json')
      .send(Buffer.from('{"key": "value"}'));

    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toMatch(/not found/);
  });

  test('authenticated users cannot update a fragment that does not exist', async () => {
    const res = await request(app)
      .put(`/v1/fragments/nonexistent-id`)
      .auth('user1@email.com', 'password1')
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json')
      .send(Buffer.from('{"key": "value"}'));

    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toMatch(/not found/);
  });

  test('authenticated users cannot update a fragment with an invalid content type', async () => {
    const res0 = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/markdown')
      .send(Buffer.from('# This is a Markdown fragment'));

    const fragmentId = res0.body.fragments[0].id;

    const res = await request(app)
      .put(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'invalid/type')
      .send(Buffer.from('{"key": "value"}'));

    expect(res.statusCode).toBe(415);
    expect(res.body.status).toBe('error');
  });

  // MD (text/markdown)
  test('authenticated users can update a MARKDOWN fragment successfully if it exists and belongs to the user', async () => {
    const res0 = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/markdown')
      .send(Buffer.from('# This is a Markdown fragment'));

    const fragmentId = res0.body.fragments[0].id;

    const res = await request(app)
      .put(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/markdown')
      .send(Buffer.from('# This is an updated Markdown fragment'));

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment.size).toBe(38);

    // Verify that the fragment has been updated
    const res2 = await request(app)
      .get(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1')
      .set('Accept', 'text/markdown');

    expect(res2.statusCode).toBe(200);
    expect(res2.text).toBe('# This is an updated Markdown fragment');
  });

  // GIF (image/gif)
  test('authenticated users can update a GIF fragment successfully if it exists and belongs to the user', async () => {
    //TEST INPUTS:
    let filename = 'file.gif';
    let MIMEtype = 'image/gif';
    let filename2 = 'file2.gif';

    const pathToImage = path.join(__dirname, '..', 'testingFiles', filename);
    const imageBuffer = fs.readFileSync(pathToImage);
    const pathToImage2 = path.join(__dirname, '..', 'testingFiles', filename2);
    const imageBuffer2 = fs.readFileSync(pathToImage2);
    //---POST-------------------------------------------
    const res0 = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', MIMEtype)
      .send(imageBuffer);

    expect(res0.statusCode).toBe(201);

    const fragmentId = res0.body.fragments[0].id;
    const fragmentSize = res0.body.fragments[0].size;

    //---PUT-------------------------------
    const res = await request(app)
      .put(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1')
      .set('Content-Type', MIMEtype)
      .send(imageBuffer2);

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');

    // Verify that the fragment has been updated
    const res2 = await request(app)
      .get(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1')
      .set('Accept', 'text/markdown');

    expect(res2.statusCode).toBe(200);
    expect(res2.body.size).not.toBe(fragmentSize);
  });
});
