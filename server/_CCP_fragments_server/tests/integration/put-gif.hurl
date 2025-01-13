# tests/integration/put-fragments-gif.hurl  (LanguageFormat: Properties) 

POST http://localhost:8080/v1/fragments 
Content-Type: image/gif 
[BasicAuth]
user1@email.com:password1

file, file.gif;

# 1. Expect an HTTP 201-Created response after POST
HTTP/1.1 201 
[Asserts] 
header "Location" matches "^http:\/\/localhost:8080\/v1\/fragments\/[A-Za-z0-9_-]+$"
jsonpath "$.status" == "ok"
jsonpath "$.fragments[0].id" matches "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
jsonpath "$.fragments[0].ownerId" matches "^[0-9a-fA-F]+$" 
jsonpath "$.fragments[0].created" isString
jsonpath "$.fragments[0].updated" isString
jsonpath "$.fragments[0].type" == "image/gif"
jsonpath "$.fragments[0].size" == 510619
 
[Captures]
url: header "Location"

# 2. try to GET the fragment we just posted using its url
GET {{url}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
Content-Type: image/gif
Content-Length: 510619
[Asserts]
file, file.gif;


#=== PUT /v1/fragments   
PUT {{url}}
Content-Type: image/gif 
[BasicAuth]
user1@email.com:password1

file, file2.gif;

# 1. Expect an HTTP 201-Created response after POST
HTTP/1.1 201 
[Asserts] 
header "Location" matches "^http:\/\/localhost:8080\/v1\/fragments\/[A-Za-z0-9_-]+$"
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" matches "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
jsonpath "$.fragment.ownerId" matches "^[0-9a-fA-F]+$" 
jsonpath "$.fragment.created" isString
jsonpath "$.fragment.updated" isString
jsonpath "$.fragment.type" == "image/gif"
jsonpath "$.fragment.size" == 38302

# 2. try to GET the fragment we just posted using its url
GET {{url}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
Content-Type: image/gif
Content-Length: 38302
[Asserts]
file, file2.gif;
