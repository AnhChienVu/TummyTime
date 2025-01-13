# tests/integration/lab-10-dynamodb.hurl  (LanguageFormat: Properties)

POST http://localhost:8080/v1/fragments
Content-Type: application/json
 
[BasicAuth]
user1@email.com:password1
 
{ 
  "service": "DynamoDB"
}
 
HTTP/1.1 201  

[Asserts]
header "Location" matches "^http:\/\/localhost:8080\/v1\/fragments\/[A-Za-z0-9_-]+$"
jsonpath "$.status" == "ok"
jsonpath "$.fragments[0].id" matches "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
jsonpath "$.fragments[0].ownerId" matches "^[0-9a-fA-F]+$"
jsonpath "$.fragments[0].created" isString
jsonpath "$.fragments[0].updated" isString
jsonpath "$.fragments[0].type" == "application/json"
jsonpath "$.fragments[0].size" == 28
 
[Captures]
fragment1_url: header "Location"
fragment1_id: jsonpath "$.fragments[0].id"
fragment1_ownerId: jsonpath "$.fragments[0].ownerId"
fragment1_created: jsonpath "$.fragments[0].created"
fragment1_updated: jsonpath "$.fragments[0].updated"


# ===2.GET the fragment we just posted using its url=================== 
GET {{fragment1_url}}/info

[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
Content-Type: application/json; charset=utf-8 

[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.id" == "{{fragment1_id}}"
jsonpath "$.ownerId" == "{{fragment1_ownerId}}"
jsonpath "$.created" == "{{fragment1_created}}"
jsonpath "$.updated" == "{{fragment1_updated}}"
jsonpath "$.type" == "application/json"
jsonpath "$.size" == 28

# ===3.POST a new MARKDOWN fragment =================== 
POST http://localhost:8080/v1/fragments
Content-Type: text/markdown

[BasicAuth]
user1@email.com:password1

`DynamoDB is **great**.`

HTTP/1.1 201

[Asserts]
header "Location" matches "^http:\/\/localhost:8080\/v1\/fragments\/[A-Za-z0-9_-]+$"
jsonpath "$.status" == "ok"
jsonpath "$.fragments[0].id" matches "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
jsonpath "$.fragments[0].ownerId" matches "^[0-9a-fA-F]+$"
jsonpath "$.fragments[0].created" isString
jsonpath "$.fragments[0].updated" isString
jsonpath "$.fragments[0].type" == "text/markdown"
jsonpath "$.fragments[0].size" == 22

[Captures]
fragment2_url: header "Location"
fragment2_id: jsonpath "$.fragments[0].id"
fragment2_ownerId: jsonpath "$.fragments[0].ownerId"
fragment2_created: jsonpath "$.fragments[0].created"
fragment2_updated: jsonpath "$.fragments[0].updated"

# ===4.GET the fragment we just posted using its url===================  
GET {{fragment2_url}}/info

[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
Content-Type: application/json; charset=utf-8 

[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.id" == "{{fragment2_id}}"
jsonpath "$.ownerId" == "{{fragment2_ownerId}}"
jsonpath "$.created" == "{{fragment2_created}}"
jsonpath "$.updated" == "{{fragment2_updated}}"
jsonpath "$.type" == "text/markdown"
jsonpath "$.size" == 22

# ===5.GET all of the fragments for the same authorized user without expanding them===================
GET http://localhost:8080/v1/fragments

[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
Content-Type: application/json; charset=utf-8

[Asserts]
jsonpath "$.status" == "ok" 
jsonpath "$.fragments" isCollection 
jsonpath "$.fragments" includes "{{fragment1_id}}"
jsonpath "$.fragments" includes "{{fragment2_id}}"

# ===6.DELETE the first fragment created above===================
DELETE http://localhost:8080/v1/fragments/{{fragment1_id}}

[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
Content-Type: application/json; charset=utf-8

[Asserts]
jsonpath "$.status" == "ok"


# ===7.Try to GET the first fragment again using the url you captured above as the authorized user===================
GET {{fragment1_url}}/info

[BasicAuth]
user1@email.com:password1

HTTP/1.1 404

[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 404
jsonpath "$.error.message" contains "not found"

# ===8.GET all of the fragments for the same authorized user without expanding them===================
GET http://localhost:8080/v1/fragments

[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
Content-Type: application/json; charset=utf-8

[Asserts]
jsonpath "$.status" == "ok"
# Check if the fragments is a list
jsonpath "$.fragments" isCollection
# Confirm that the first id is NOT included but that the second id is
jsonpath "$.fragments" not includes "{{fragment1_id}}"
jsonpath "$.fragments" includes "{{fragment2_id}}"
