# tests/integration/post-fragments-unauthenticated.hurl (LanguageFormat: Properties) 

POST http://localhost:8080/v1/fragments 
Content-Type: text/plain
# NO credentials added
 
`This is a fragment!`

# 1. Expect an HTTP 401-Unauthorized 
HTTP/1.1 401
[Asserts] 
jsonpath "$.status" == "error"
