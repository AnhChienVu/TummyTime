# tests/integration/get-avif-to-png.hurl  (LanguageFormat: Properties)
 
POST http://localhost:8080/v1/fragments 
Content-Type: image/avif 
[BasicAuth]
user1@email.com:password1

file, file.avif;
 
HTTP/1.1 201 
[Asserts] 
header "Location" matches "^http:\/\/localhost:8080\/v1\/fragments\/[A-Za-z0-9_-]+$"
jsonpath "$.status" == "ok"
jsonpath "$.fragments[0].id" matches "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
jsonpath "$.fragments[0].ownerId" matches "^[0-9a-fA-F]+$" 
jsonpath "$.fragments[0].created" isString
jsonpath "$.fragments[0].updated" isString
jsonpath "$.fragments[0].type" == "image/avif"
jsonpath "$.fragments[0].size" == 19384
 
[Captures]
url: header "Location"

# try to GET the fragment we just posted using its url
GET {{url}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
Content-Type: image/avif
Content-Length: 19384
[Asserts]
file, file.avif;


# try to GET AS PNG the fragment we just posted using its url
GET {{url}}.png
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
Content-Type: image/png
Content-Length: 365887
