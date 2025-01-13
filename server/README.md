# Tummy Time Microservice

## 1. API Version

This is the first version of the fragments API, and all URL endpoints discussed below begin with the current version: `/v1/*`. Defining such a version gives flexibility to change the API at a later date, while still supporting older versions in parallel.

## 2. Authentication

Most API routes discussed below require either [Basic HTTP credentials](https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication), or a [JSON Web Token (JWT)](https://jwt.io/) to be sent along with each request in the `Authorization` header.

In many of the examples below, user credentials are sent in the `Authorization` header using `curl`, for example:

```sh
curl -u email:password https://tummytime-api.com/v1/users
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
  "user": {
    "userId": 1,
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "relationshipType": "Father",
    "userBabyId": 1 },
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
  "version": "version from package.json"
}
```

#### 4.1.1 Example using `curl`

```sh
$ curl -i https://tummytime-api.com/

HTTP/1.1 200 OK
Cache-Control: no-cache
Content-Type: application/json; charset=utf-8

{"status":"ok","version":"0.5.3"}
```

### 4.2 Users

The main data format of the API is the `user`.

#### 4.2.1 User Overview

Users have metadata (i.e., details _about_ the user).

The user's **metadata** is an object that describes the user in the following format:

```json
{
  "userId": 1,
  "email": "john.doe@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "relationshipType": "Father", 
  "created": "2021-11-02T15:09:50.403Z",
  "updated": "2021-11-02T15:09:50.403Z",
  "numberOfBabies": 2
}
```

Here the user has a unique `userId` (a UUID), as well as an unhashed email address for the user (_later_ will be hashed and stored as a HEX string). Information about when the user was created, updated, its numberOfBabies, and size are also included.

#### 4.2.2 Fragment Metadata Properties

The user `userId` is a unique, URL-friendly, string identifier, for example `30a84843-0cd4-4975-95ba-b96112aea189`. Such ids can be generated using a [UUID](https://en.wikipedia.org/wiki/Universally_unique_identifier) with the built-in [crypto](https://nodejs.org/api/crypto.html#cryptorandomuuidoptions) module. 

Clients can only create, update, or delete _user_ for themselves (i.e,. they must be authenticated).

The `created` and `updated` fields are [ISO 8601 Date strings](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString). This is the format used by JavaScript when _stringifying_ a `Date`: `const isoDate = JSON.stringify(new Date)`.

The `numberOfBabies` is the number (integer) of babies related to this user, and is automatically calculated when a user and its babies are created or updated.

### 4.3 `POST /users`


#### 4.3.1 Example using `curl`


### 4.4 `GET /users`

Gets all users in the database. NOTE: if there is no users, an empty array `[]` is returned instead of an error.

The response includes a `users` array of `userId`s:

```json
{
  "status": "ok",
  "users": ["b9e7a264-630f-436d-a785-27f30233faea", "dad25b07-8cd6-498b-9aaf-46d358ea97fe"]
}
```

Example using `curl`:

```sh
curl -i -u user1@email.com:password1 https://tummytime-api.com/v1/users

HTTP/1.1 200 OK

{
  "status": "ok",
  "users": [
    "4dcc65b6-9d57-453a-bd3a-63c107a51698",
    "30a84843-0cd4-4975-95ba-b96112aea189"
  ]
}
```

#### 4.4 `GET /users/:id`

Gets a user's metadata with the given `id`.

If the `id` does not represent a known fragment, returns an HTTP `404` with an appropriate error message.

### 4.5 `PUT /users/:id`

Allows the authenticated user to update (i.e., replace) the metadata for their existing user with the specified `userId`.

If no such user exists with the given `userId`, returns an HTTP `404` with an appropriate error message.

The entire request `body` is used to update the fragment's metadata, replacing the original value for each metadata field.

The successful response includes an HTTP `200` as well as updated fragment metadata:


```json
{≈
}
```

```json
{
  "status": "ok",
  "user": {
    "userId": 1,
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "relationshipType": "Father", 
    "created": "2021-11-02T15:09:50.403Z",
    "updated": "2021-11-02T15:09:50.403Z",
    "numberOfBabies": 2
  }
}
```

#### 4.5.1 Example using `curl`

### 4.5 `DELETE /users/:id`

Allows deleting one of their existing users with the given `id`.

If the `id` is not found, returns an HTTP `404` with an appropriate error message.

Once the fragment is deleted, an HTTP `200` is returned, along with the `ok` status:

```json
{ "status": "ok" }
```

#### 4.8.1 Example using `curl`

```sh
curl -i \
  -X DELETE \
  https://tummytime-api.com/v1/users/4dcc65b6-9d57-453a-bd3a-63c107a51698

HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Content-Length: 15

{ "status": "ok" }
```
