# Tummy Time Fragments Microservice

## 1. API Version

This is the first version of the fragments API, and all URL endpoints discussed below begin with the current version: `/v1/*`. Defining such a version gives flexibility to change the API at a later date, while still supporting older versions in parallel.

## 2. Authentication

Most API routes discussed below require either [Basic HTTP credentials](https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication), or a [JSON Web Token (JWT)](https://jwt.io/) to be sent along with each request in the `Authorization` header.

In many of the examples below, user credentials are sent in the `Authorization` header using `curl`, for example:

```sh
curl -u email:password https://tummytime-api.com/v1/fragments
```

_NOTE_: in the examples below, `https://tummytime-api.com/` is used as the service URL. However, this URL is only used for documentation purposes. It is not owned or associated with this API in any way.

## 3. Responses

Most responses from the API are returned in JSON format (`application/json`) unless otherwise specified.

Responses also include an extra `status` property, which indicates whether the request was successful (i.e., `'ok'`) or produced an error (`'error'`).

### 3.1 Example: successful response

Successful responses use an HTTP `2xx` status and always include a `"status": "ok"` property/value:

```json
{
  "status": "ok"
}
```

If a response includes other data, it will be included along with the `status`, for example:

```json
{
  "status": "ok",
  "fragment": {
    "id": "30a84843-0cd4-4975-95ba-b96112aea189",
    "ownerId": "11d4c22e42c8f61feaba154683dea407b101cfd90987dda9e342843263ca420a",
    "created": "2021-11-02T15:09:50.403Z",
    "updated": "2021-11-02T15:09:50.403Z",
    "type": "text/plain",
    "size": 256
  }
}
```

### 3.2 Example: error response

Error responses use an appropriate HTTP `4xx` (client error) or `5xx` (server error), and include an `error` object, which has both the error `code` (a `number`) and a human readable error `message` (a `string`).

```json
{
  "status": "error",
  "error": {
    "code": 400,
    "message": "invalid request"
  }
}
```

## 4. API

### 4.1 Health Check

An unauthenticated `/` route is available for checking the health of the service. If the service is running, it returns an HTTP `200` status along with the following body:

```json
{
  "status": "ok",
  "author": "author from package.json (your name, email)",
  "githubUrl": "https://github.com/your-name/your-repo",
  "version": "version from package.json"
}
```

#### 4.1.1 Example using `curl`

```sh
$ curl -i https://fragments-api.com/

HTTP/1.1 200 OK
Cache-Control: no-cache
Content-Type: application/json; charset=utf-8

{"status":"ok","author":"David Humphrey <david.humphrey@senecapolytechnic.ca>","githubUrl":"https://github.com/humphd/fragments","version":"0.5.3"}
```

### 4.2 Fragments

The main data format of the API is the `fragment`.

#### 4.2.1 Fragment Overview

Fragments have two parts: 1) metadata (i.e., details _about_ the fragment); and 2) data (i.e., the actual binary contents of the fragment).

The fragment's **metadata** is an object that describes the fragment in the following format:

```json
{
  "id": "30a84843-0cd4-4975-95ba-b96112aea189",
  "ownerId": "11d4c22e42c8f61feaba154683dea407b101cfd90987dda9e342843263ca420a",
  "created": "2021-11-02T15:09:50.403Z",
  "updated": "2021-11-02T15:09:50.403Z",
  "type": "text/plain",
  "size": 256
}
```

Here the fragment has a unique `id` (a UUID), as well as a hashed email address for the owner (stored as a HEX string). Information about when the fragment was created, updated, its type, and size are also included.

The fragment's **data** is always a **binary blob**, and represents the actual contents of the fragment (e.g., a text or image file). In node.js, we use the `Buffer` type to represent this blob.

#### 4.2.2 Fragment Metadata Properties

The fragment `id` is a unique, URL-friendly, string identifier, for example `30a84843-0cd4-4975-95ba-b96112aea189`. Such ids can be generated using a [UUID](https://en.wikipedia.org/wiki/Universally_unique_identifier) with the built-in [crypto](https://nodejs.org/api/crypto.html#cryptorandomuuidoptions) module.

The `ownerId` is the hashed email address of the user who owns this fragment. NOTE: for increased data privacy, we don't store the actual email address, only its [SHA256 hash](https://en.wikipedia.org/wiki/SHA-2).

Users can only create, update, or delete fragments for themselves (i.e,. they must be authenticated).

The `created` and `updated` fields are [ISO 8601 Date strings](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString). This is the format used by JavaScript when _stringifying_ a `Date`: `const isoDate = JSON.stringify(new Date)`.

The `type` is a [Content Type](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type), which includes the fragment's [media type](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types) and possibly an optional character encoding (`charset`). The `type` describes the data (i.e., the data is text or a PNG). Valid examples of the `type` include:

1. `text/plain`
2. `text/plain; charset=utf-8`
3. `text/markdown`
4. `text/html`
5. `text/csv`
6. `application/json`
7. `application/yaml`
8. `image/png`
9. `image/jpeg`
10. `image/webp`

NOTE: we store the entire `Content-Type` (i.e., with the `charset` if present), but also allow using only the media type prefix (e.g., `text/html` vs. `text/html; charset=iso-8859-1`).

The `size` is the number (integer) of bytes of data stored for this fragment, and is automatically calculated when a fragment is created or updated.

### 4.3 `POST /fragments`

Creates a new fragment for the current user (i.e., authenticated user). The client posts a file (raw binary data) in the `body` of the request and sets the `Content-Type` header to the desired `type` of the fragment. The `type` must be one of the supported types. This is used to generate a new fragment metadata record for the data, and then both the data and metadata are stored.

If the `Content-Type` of the fragment being sent with the request is not supported, an HTTP `415` is returned with an appropriate error message.

A successful response returns an HTTP `201`. It includes a `Location` header with a full URL to use in order to access the newly created fragment, for example: `Location: https://fragments-api.com/v1/fragments/30a84843-0cd4-4975-95ba-b96112aea189`. See <https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.30>.

The `body` of the response includes the complete fragment metadata for the newly created fragment:

```json
{
  "status": "ok",
  "fragment": {
    "id": "30a84843-0cd4-4975-95ba-b96112aea189",
    "ownerId": "11d4c22e42c8f61feaba154683dea407b101cfd90987dda9e342843263ca420a",
    "created": "2021-11-02T15:09:50.403Z",
    "updated": "2021-11-02T15:09:50.403Z",
    "type": "text/plain",
    "size": 256
  }
}
```

#### 4.3.1 Example using `curl`

```sh
curl -i \
  -X POST \
  -u user1@email.com:password1 \
  -H "Content-Type: text/plain" \
  -d "This is a fragment" \
  https://fragments-api.com/v1/fragments

HTTP/1.1 201 Created
Location: https://fragments-api.com/v1/fragments/30a84843-0cd4-4975-95ba-b96112aea189
Content-Type: application/json; charset=utf-8
Content-Length: 187

{
  "status": "ok",
  "fragment": {
    "id": "30a84843-0cd4-4975-95ba-b96112aea189",
    "created": "2021-11-08T01:04:46.071Z",
    "updated": "2021-11-08T01:04:46.073Z",
    "ownerId": "11d4c22e42c8f61feaba154683dea407b101cfd90987dda9e342843263ca420a",
    "type": "text/plain",
    "size": 18
  }
}
```

### 4.4 `GET /fragments`

Gets all fragments belonging to the current user (i.e., authenticated user). NOTE: if a user has no fragments, an empty array `[]` is returned instead of an error.

The response includes a `fragments` array of `id`s:

```json
{
  "status": "ok",
  "fragments": ["b9e7a264-630f-436d-a785-27f30233faea", "dad25b07-8cd6-498b-9aaf-46d358ea97fe"]
}
```

Example using `curl`:

```sh
curl -i -u user1@email.com:password1 https://fragments-api.com/v1/fragments

HTTP/1.1 200 OK

{
  "status": "ok",
  "fragments": [
    "4dcc65b6-9d57-453a-bd3a-63c107a51698",
    "30a84843-0cd4-4975-95ba-b96112aea189"
  ]
}
```

#### 4.4.1 `GET /fragments/?expand=1`

Gets all fragments belonging to the current user (i.e., authenticated user), expanded to include a full representation of the fragments' metadata (i.e., not just `id`). For example, using `GET /fragments?expand=1` might return:

```json
{
  "status": "ok",
  "fragments": [
    {
      "id": "b9e7a264-630f-436d-a785-27f30233faea",
      "ownerId": "11d4c22e42c8f61feaba154683dea407b101cfd90987dda9e342843263ca420a",
      "created": "2021-11-02T15:09:50.403Z",
      "updated": "2021-11-02T15:09:50.403Z",
      "type": "text/plain",
      "size": 256
    },
    {
      "id": "dad25b07-8cd6-498b-9aaf-46d358ea97fe",
      "ownerId": "11d4c22e42c8f61feaba154683dea407b101cfd90987dda9e342843263ca420a",
      "created": "2021-11-02T15:09:50.403Z",
      "updated": "2021-11-02T15:09:50.403Z",
      "type": "text/plain",
      "size": 256
    },
    {
      "id": "fdf71254-d217-4675-892c-a185a4f1c9b4",
      "ownerId": "11d4c22e42c8f61feaba154683dea407b101cfd90987dda9e342843263ca420a",
      "created": "2021-11-02T15:09:50.403Z",
      "updated": "2021-11-02T15:09:50.403Z",
      "type": "text/plain",
      "size": 256
    }
  ]
}
```

#### 4.4.2 Example using `curl`

```sh
curl -i -u user1@email.com:password1 https://fragments-api.com/v1/fragments?expand=1

HTTP/1.1 200 OK

{
  "status": "ok",
  "fragments": [
    {
      "id": "4dcc65b6-9d57-453a-bd3a-63c107a51698",
      "created": "2021-11-08T01:08:20.269Z",
      "updated": "2021-11-08T01:08:20.271Z",
      "ownerId": "11d4c22e42c8f61feaba154683dea407b101cfd90987dda9e342843263ca420a",
      "type": "text/plain",
      "size": 18
    },
    {
      "id": "30a84843-0cd4-4975-95ba-b96112aea189",
      "created": "2021-11-08T01:04:46.071Z",
      "updated": "2021-11-08T01:04:46.073Z",
      "ownerId": "11d4c22e42c8f61feaba154683dea407b101cfd90987dda9e342843263ca420a",
      "type": "text/plain",
      "size": 300
    }
  ]
}
```

### 4.5 `GET /fragments/:id`

Gets an authenticated user's fragment data (i.e., raw binary data) with the given `id`.

If the `id` does not represent a known fragment, returns an HTTP `404` with an appropriate error message.

If the `id` includes an optional extension (e.g., `.txt` or `.png`), the server attempts to convert the fragment to the `type` associated with that extension. Otherwise the successful response returns the raw fragment data using the `type` specified when created (e.g., `text/plain` or `image/png`) as its `Content-Type`.

For example, a Markdown fragment at `https://fragments-api.com/v1/fragments/4dcc65b6-9d57-453a-bd3a-63c107a51698` could be automatically converted to HTML using `https://fragments-api.com/v1/fragments/4dcc65b6-9d57-453a-bd3a-63c107a51698.html` (note the `.html` extension) or to Plain Text using `https://fragments-api.com/v1/fragments/4dcc65b6-9d57-453a-bd3a-63c107a51698.txt` (note the `.txt` extension)

If the extension used represents an unknown or unsupported type, or if the fragment cannot be converted to this type, an HTTP `415` error is returned instead, with an appropriate message. For example, a plain text fragment cannot be returned as a PNG.

#### 4.5.1 Valid Fragment Conversions

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

#### 4.5.2 Example using `curl`

```sh
curl -i -u user1@email.com:password1 https://fragments-api.com/v1/fragments/4dcc65b6-9d57-453a-bd3a-63c107a51698

HTTP/1.1 200 OK
Content-Type: text/plain
Content-Length: 18

This is a fragment
```

Example using `curl` to convert a Markdown fragment to HTML:

```sh
curl -i -u user1@email.com:password1 https://fragments-api.com/v1/fragments/fdf71254-d217-4675-892c-a185a4f1c9b4.html

HTTP/1.1 200 OK
Content-Type: text/html
Content-Length: 28

<h1>This is a fragment</h1>
```

### 4.6 `PUT /fragments/:id`

Allows the authenticated user to update (i.e., replace) the data for their existing fragment with the specified `id`.

If no such fragment exists with the given `id`, returns an HTTP `404` with an appropriate error message.

If the `Content-Type` of the request does not match the existing fragment's `type`, returns an HTTP `400` with an appropriate error message. A fragment's type can not be changed after it is created.

The entire request `body` is used to update the fragment's data, replacing the original value.

The successful response includes an HTTP `200` as well as updated fragment metadata:

```json
{
  "status": "ok",
  "fragment": {
    "id": "fdf71254-d217-4675-892c-a185a4f1c9b4",
    "ownerId": "11d4c22e42c8f61feaba154683dea407b101cfd90987dda9e342843263ca420a",
    "created": "2021-11-02T15:09:50.403Z",
    "updated": "2021-11-02T15:09:50.403Z",
    "type": "text/plain",
    "size": 1024
  }
}
```

#### 4.6.1 Example using `curl`

```sh
curl -i \
  -X PUT \
  -u user1@email.com:password1 \
  -H "Content-Type: text/plain" \
  -d "This is updated data" \
  https://fragments-api.com/v1/fragments/4dcc65b6-9d57-453a-bd3a-63c107a51698

HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Content-Length: 187

{
  "status": "ok",
  "fragment": {
    "id": "4dcc65b6-9d57-453a-bd3a-63c107a51698",
    "created": "2021-11-08T01:08:20.269Z",
    "updated": "2021-11-08T01:17:21.830Z",
    "ownerId": "11d4c22e42c8f61feaba154683dea407b101cfd90987dda9e342843263ca420a",
    "type": "text/plain",
    "size": 20,
    "formats": [
      "text/plain"
    ]
  }
}
```

### 4.7 `GET /fragments/:id/info`

Allows the authenticated user to get (i.e., read) the metadata for one of their existing fragments with the specified `id`. If no such fragment exists, returns an HTTP `404` with an appropriate error message.

The fragment's metadata is returned:

```json
{
  "status": "ok",
  "fragment": {
    "id": "fdf71254-d217-4675-892c-a185a4f1c9b4",
    "ownerId": "11d4c22e42c8f61feaba154683dea407b101cfd90987dda9e342843263ca420a",
    "created": "2021-11-02T15:09:50.403Z",
    "updated": "2021-11-02T15:09:50.403Z",
    "type": "text/plain",
    "size": 1024
  }
}
```

#### 4.7.1 Example using `curl`

```sh
curl -i \
  -u user1@email.com:password1 \
  https://fragments-api.com/v1/fragments/4dcc65b6-9d57-453a-bd3a-63c107a51698/info

HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Content-Length: 187

{
  "status": "ok",
  "fragment": {
    "id": "4dcc65b6-9d57-453a-bd3a-63c107a51698",
    "created": "2021-11-08T01:08:20.269Z",
    "updated": "2021-11-08T01:17:21.830Z",
    "ownerId": "11d4c22e42c8f61feaba154683dea407b101cfd90987dda9e342843263ca420a",
    "type": "text/plain",
    "size":20,
  }
}
```

### 4.8 `DELETE /fragments/:id`

Allows the authenticated user to delete one of their existing fragments with the given `id`.

If the `id` is not found, returns an HTTP `404` with an appropriate error message.

Once the fragment is deleted, an HTTP `200` is returned, along with the `ok` status:

```json
{ "status": "ok" }
```

#### 4.8.1 Example using `curl`

```sh
curl -i \
  -X DELETE \
  -u user1@email.com:password1 \
  https://fragments-api.com/v1/fragments/4dcc65b6-9d57-453a-bd3a-63c107a51698

HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Content-Length: 15

{ "status": "ok" }
```
