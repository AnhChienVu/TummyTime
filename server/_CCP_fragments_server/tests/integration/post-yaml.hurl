# tests/integration/post-fragments-yaml.hurl  (LanguageFormat: Properties) 

POST http://localhost:8080/v1/fragments 
Content-Type: application/yaml 
[BasicAuth]
user1@email.com:password1

# NOTE-: YAML INDENTATION IS IMPORTANT:  YAML does not allow a list item (-) to be nested directly under another list item without proper indentation for grouping.
```
- name: John Doe 
  email: 123@email.com
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
jsonpath "$.fragments[0].type" == "application/yaml"
jsonpath "$.fragments[0].size" == 41
 
[Captures]
url: header "Location"

# 2. try to GET the fragment we just posted using its url
GET {{url}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
Content-Type: application/yaml
Content-Length: 41
[Asserts] 
body == ```
- name: John Doe 
  email: 123@email.com
```

