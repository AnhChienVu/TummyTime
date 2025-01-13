# tests/integration/404.hurl  (LanguageFormat: Properties)

# 404 Test
GET http://localhost:8080/no-such-route

# EXPECTING
HTTP/1.1 404
