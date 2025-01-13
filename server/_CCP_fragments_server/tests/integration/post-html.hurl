# tests/integration/post-html.hurl  (LanguageFormat: Properties) 

POST http://localhost:8080/v1/fragments 
Content-Type: text/html 
[BasicAuth]
user1@email.com:password1

file, file.html;

# 1. Expect an HTTP 201-Created response after POST
HTTP/1.1 201 
[Asserts] 
header "Location" matches "^http:\/\/localhost:8080\/v1\/fragments\/[A-Za-z0-9_-]+$"
jsonpath "$.status" == "ok"
jsonpath "$.fragments[0].id" matches "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
jsonpath "$.fragments[0].ownerId" matches "^[0-9a-fA-F]+$" 
jsonpath "$.fragments[0].created" isString
jsonpath "$.fragments[0].updated" isString
jsonpath "$.fragments[0].type" == "text/html"
jsonpath "$.fragments[0].size" == 34
 
[Captures]
url: header "Location"

# 2. try to GET the fragment we just posted using its url
GET {{url}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
Content-Type: text/html
Content-Length: 34
[Asserts]
file, file.html;
