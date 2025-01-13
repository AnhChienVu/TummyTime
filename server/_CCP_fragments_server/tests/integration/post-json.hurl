# tests/integration/post-fragments-json.hurl  (LanguageFormat: Properties)

POST http://localhost:8080/v1/fragments 
Content-Type: application/json 
[BasicAuth]
user1@email.com:password1
 
```
{
  "data": "This is a fragment!"
}
```

# 1. Expect an HTTP 201-Created response after POST
HTTP/1.1 201 
[Asserts] 
header "Location" matches "^http:\/\/localhost:8080\/v1\/fragments\/[A-Za-z0-9_-]+$"
jsonpath "$.status" == "ok"
jsonpath "$.fragments[0].id" matches "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
jsonpath "$.fragments[0].ownerId" matches "^[0-9a-fA-F]+$" 
jsonpath "$.fragments[0].created" isString
jsonpath "$.fragments[0].updated" isString
jsonpath "$.fragments[0].type" == "application/json"
jsonpath "$.fragments[0].size" == 36

# Capture the Location URL into a variable
[Captures]
url: header "Location"

# 2. try to GET the fragment we just posted using its url
GET {{url}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
Content-Type: application/json
Content-Length: 36
[Asserts]
body == ```
{
  "data": "This is a fragment!"
}
```

