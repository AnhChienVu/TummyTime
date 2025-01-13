# tests/integration/post-fragments-unsupported-type.hurl  (LanguageFormat: Properties) 

POST http://localhost:8080/v1/fragments 
Content-Type: non/existent 
[BasicAuth]
user1@email.com:password1
 
`This is a fragment!`

# 1. Expect an HTTP 400-Bad Request response after POST
HTTP/1.1 400
[Asserts] 
jsonpath "$.status" == "error"  
