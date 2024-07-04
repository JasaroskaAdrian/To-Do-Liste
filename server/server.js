const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '../html')));

const PORT = 3000;
const SECRET_KEY = 'your_secret_key';

let db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) {
        console.error('Could not connect to database', err);
    } else {
        console.log('Connected to database');
    }
});

db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY, name TEXT)");
    db.run("CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY, name TEXT, price REAL, categoryId INTEGER, image TEXT, FOREIGN KEY(categoryId) REFERENCES categories(id))");
    db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT UNIQUE, password TEXT, role TEXT)");

    const hashedAdminPassword = bcrypt.hashSync('admin', 10);
    db.run("INSERT INTO users (username, password, role) VALUES (?, ?, ?) ON CONFLICT(username) DO NOTHING", ['admin', hashedAdminPassword, 'admin']);
});

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

function authorizeAdmin(req, res, next) {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    next();
}

// Serve HTML file
app.get('/products', (req, res) => {
    res.sendFile(path.join(__dirname, '../html', 'mainMenu.html'));
});

// CRUD Operations

// Create - Produkt erstellen
app.post('/api/products', authenticateToken, authorizeAdmin, (req, res) => {
    const { name, price, categoryId, image } = req.body;
    db.run("INSERT INTO products (name, price, categoryId, image) VALUES (?, ?, ?, ?)", [name, price, categoryId, image], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.status(201).json({ id: this.lastID, name, price, categoryId, image });
    });
});

// Read - Alle Produkte lesen
app.get('/api/products', authenticateToken, (req, res) => {
    db.all("SELECT * FROM products", (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Read - Einzelnes Produkt per ID lesen
app.get('/api/products/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    db.get("SELECT * FROM products WHERE id = ?", [id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(row || { message: 'Product not found' });
    });
});

// Update - Produkt aktualisieren
app.put('/api/products/:id', authenticateToken, authorizeAdmin, (req, res) => {
    const { id } = req.params;
    const { name, price, categoryId, image } = req.body;
    db.run("UPDATE products SET name = ?, price = ?, categoryId = ?, image = ? WHERE id = ?", [name, price, categoryId, image, id], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id, name, price, categoryId, image });
    });
});

// Delete - Produkt löschen
app.delete('/api/products/:id', authenticateToken, authorizeAdmin, (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM products WHERE id = ?", [id], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Product deleted' });
    });
});

// Serve the Login Page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../html', 'login.html'));
});

// Route zur Anmeldung
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!user || !bcrypt.compareSync(password, user.password)) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        const token = jwt.sign({ username: user.username, role: user.role }, SECRET_KEY);
        res.json({ token });
    });
});

// Serve the Registration Page
app.get('/registration', (req, res) => {
    res.sendFile(path.join(__dirname, '../html', 'registrieren.html'));
});

// Route zur Registrierung
app.post('/registration', (req, res) => {
    const { username, password, role = 'user' } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    db.run("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", [username, hashedPassword, role], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.status(201).json({ id: this.lastID, username, role });
    });
});

// Serve the mainMenu page
app.get('/products', (req, res) => {
    res.sendFile(path.join(__dirname, '../html', 'mainMenu.html'));
});

// Swagger setup
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Serve the edit page
app.get('/products/:id/edit', (req, res) => {
    res.sendFile(path.join(__dirname, '../html', 'edit.html'));
});

// Serve the show page
app.get('/products/:id/show', (req, res) => {
    res.sendFile(path.join(__dirname, '../html', 'show.html'));
});

// Indication that the Server is running, also shows the URL on which it is running
app.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}`);
});
