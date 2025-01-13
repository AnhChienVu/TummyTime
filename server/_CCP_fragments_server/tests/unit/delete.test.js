// tests/unit/delete.test.js

const request = require('supertest');

const app = require('../../src/app');
const fs = require('fs');
const path = require('path');

describe('DELETE /v1/fragments/:id', () => {
  test('authenticated users can delete a MARKDOWN fragment successfully if it exists and belongs to the user', async () => {
    const res0 = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/markdown')
      .send(Buffer.from('# This is a Markdown fragment'));

    const fragmentId = res0.body.fragments[0].id;

    const res = await request(app)
      .delete(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1')
      .set('Accept', 'application/json');

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');

    // Verify that the fragment no longer exists
    const res2 = await request(app)
      .get(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1');
    expect(res2.statusCode).toBe(404);
    expect(res2.body.status).toBe('error');
    expect(res2.body.error.message).toMatch(/not found/);
  });

  //GIF (image/gif)
  test('authenticated users can delete a GIF fragment successfully if it exists and belongs to the user', async () => {
    //TEST INPUTS:
    let filename = 'file.gif';
    let MIMEtype = 'image/gif';

    // Create an IMAGE fragment
    const pathToImage = path.join(__dirname, '..', 'testingFiles', filename);
    const imageBuffer = fs.readFileSync(pathToImage); // Read the image file into a BUFFER
    //---POST-------------------------------------------
    const res0 = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', MIMEtype)
      .send(imageBuffer);

    expect(res0.statusCode).toBe(201);

    const fragmentId = res0.body.fragments[0].id;

    //---DELETE-------------------------------
    const res = await request(app)
      .delete(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1')
      .set('Accept', 'application/json');

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');

    // Verify that the fragment no longer exists
    const res2 = await request(app)
      .get(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1');
    expect(res2.statusCode).toBe(404);
    expect(res2.body.status).toBe('error');
    expect(res2.body.error.message).toMatch(/not found/);
  });

  test('authenticated users cannot delete a fragment that does not belong to them', async () => {
    const res0 = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/markdown')
      .send(Buffer.from('# Fragment for user1'));
    const fragmentId = res0.body.fragments[0].id;

    // Attempt to delete the fragment with another user
    const res = await request(app)
      .delete(`/v1/fragments/${fragmentId}`)
      .auth('user2@email.com', 'password2')
      .set('Accept', 'application/json');

    // Assert that the response is a 404 Not Found error
    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toMatch(/Fragment not found/);
  });

  test('deleting a non-existing fragment returns a 404 error', async () => {
    // Attempt to delete a non-existent fragment
    const nonExistentFragmentId = 'nonexistent-id';

    const res = await request(app)
      .delete(`/v1/fragments/${nonExistentFragmentId}`)
      .auth('user1@email.com', 'password1')
      .set('Accept', 'application/json');

    // Assert that the response is a 404 Not Found error
    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toMatch(/Fragment not found/);
  });
});
