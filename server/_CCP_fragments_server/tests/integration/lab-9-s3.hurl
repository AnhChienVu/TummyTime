# tests/integration/lab-9-s3.hurl  (LanguageFormat: Properties)

# Using LocalStack for S3 Development vs. AWS S3
# Tests for S3

# ===1.POST a new text fragment ===
POST http://localhost:8080/v1/fragments
Content-Type: text/plain 
[BasicAuth]
user1@email.com:password1
 
`Hello S3!`
 
HTTP/1.1 201   
[Captures]
url: header "Location"

# ===2.GET the fragment we just posted using its url===
GET {{url}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
Content-Type: text/plain
Content-Length: 9
[Asserts]
body == "Hello S3!"

# ===3.DELETE the fragment we just posted using its url===
DELETE {{url}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200

# ===4.Try to GET the fragment again using its url===
GET {{url}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 404

