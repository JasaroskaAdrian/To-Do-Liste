const express = require('express');
const path = require('path');
// From online-shop-api Repo
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

const app = express();
app.use(express.json());

const PORT = 3000;
const SECRET_KEY = 'your_secret_key';

// DB setup
let db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) {
        console.error('Could not connect to database', err);
    } else {
        console.log('Connected to database');
    }
});

db.serialize(() => {z
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

// CRUD Operations

// Create - Produkt erstellen
app.post('/products', authenticateToken, authorizeAdmin, (req, res) => {
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
app.get('/products', (req, res) => {
    db.all("SELECT * FROM products", (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Read - Einzelnes Produkt per ID lesen
app.get('/products/:id', (req, res) => {
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
app.put('/products/:id', authenticateToken, authorizeAdmin, (req, res) => {
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
app.delete('/products/:id', authenticateToken, authorizeAdmin, (req, res) => {
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
app.post('/', (req, res) => {
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

/*   !!MUSS NOCH IMPLEMENTIERT WERDEN
// Route zum Zurücksetzen des Passworts
app.post('/reset-password', authenticateToken, (req, res) => {
    const { username, newPassword } = req.body;
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    db.run("UPDATE users SET password = ? WHERE username = ?", [hashedPassword, username], function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'Password reset successfully' });
    });
  });
*/

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
app.get('/products/main', (req, res) => {
    res.sendFile(path.join(__dirname, '../html', 'mainMenu.html'));
});

// Swagger setup
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

/* !!MUSS NOCH IMPLEMENTIERT WERDEN
// Routes for categories (public)
app.get('/categories', (req, res) => {
    db.all("SELECT * FROM categories", (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    });
  });
*/

/* //DIENT UM KATEGORIEN ZU ERSTELLEN
app.post('/categories', authenticateToken, authorizeAdmin, (req, res) => {
    const { name } = req.body;
    db.run("INSERT INTO categories (name) VALUES (?)", [name], function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.status(201).json({ id: this.lastID, name });
    });
  });
*/

/* DIENT ZUR AUSWAHL VON GEWISSE KATEGORIEN
app.get('/categories/:id', (req, res) => {
    const { id } = req.params;
    db.get("SELECT * FROM categories WHERE id = ?", [id], (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(row || { message: 'Category not found' });
    });
  });
*/

/* DIENT ZUR BEARBEITEN DER KATEGORIEN
app.put('/categories/:id', authenticateToken, authorizeAdmin, (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    db.run("UPDATE categories SET name = ? WHERE id = ?", [name, id], function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id, name });
    });
  });
*/

/* DIENT ZUR LÖSCHEN VON KATEGORIEN
app.delete('/categories/:id', authenticateToken, authorizeAdmin, (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM categories WHERE id = ?", [id], function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'Category deleted' });
    });
  });
*/

/* //DIENT ZUR AUFLISTUNG ALLER PRODUKTE
app.get('/products', (req, res) => {
    db.all("SELECT * FROM products", (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    });
  });
*/

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
