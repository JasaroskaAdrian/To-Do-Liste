# Online Shop API

Filebasierte SQLite Datenbank
Node.JS Backend
Installation
Module installieren:
npm install / npm install express jsonwebtoken body-parser sqlite3 bcrypt swagger-ui-express
Den Server starten:
node server.js 
Die API wird dann unter http://localhost:3000/ verfügbar sein und die Swagger-Dokumentation wird unter http://localhost:3000/api-docs zugänglich sein.

Authentifizierung und Rollen
Diese API verwendet JSON Web Tokens (JWT) zur Authentifizierung und Autorisierung. Es gibt zwei Rollen: admin und user.

Standard-Admin-Benutzer
Beim Starten des Servers wird ein Standard-Admin-Benutzer erstellt:

Benutzername: admin
Passwort: admin
Endpunkte
Registrierung
URL: /register
Methode: POST
Beschreibung: Registriert einen neuen Benutzer mit der Standardrolle user.
Body:
{
  "username": "string",
  "password": "string",
  "role": "string"  // optional, default is "user"
}
Erfolgsantwort: 201 Created
Fehlerantwort: 500 Internal Server Error
Anmeldung
URL: /login
Methode: POST
Beschreibung: Meldet einen Benutzer an und gibt einen JWT zurück.
Body:
{
  "username": "string",
  "password": "string"
}
Erfolgsantwort: 200 OK mit Token
Fehlerantwort: 401 Unauthorized, 500 Internal Server Error

Kategorien
GET /categories: Zugriff offen
POST /categories: Nur admin
GET /categories/:id: Zugriff offen
PUT /categories/:id: Nur admin
DELETE /categories/:id: Nur admin
Produkte
GET /products: Zugriff offen
POST /products: Nur admin
GET /products/:id: Zugriff offen
PUT /products/:id: Nur admin
DELETE /products/:id: Nur admin
Beispielanfragen
Registrierung
curl -X POST http://localhost:3000/register -H "Content-Type: application/json" -d '{
  "username": "user1",
  "password": "password123"
}'
Anmeldung
curl -X POST http://localhost:3000/ -H "Content-Type: application/json" -d '{
  "username": "admin",
  "password": "admin"
}'
