const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'your-secret-key-change-this-in-production';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());
app.use(express.static('public'));

// Database setup
const db = new sqlite3.Database('./inventory.db', (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database');
        initializeDatabase();
    }
});

// Initialize database tables
function initializeDatabase() {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Products table
    db.run(`CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Create default admin user if not exists
    const defaultPassword = 'admin123';
    bcrypt.hash(defaultPassword, 10, (err, hash) => {
        if (err) {
            console.error('Error hashing password:', err);
            return;
        }
        
        db.run(`INSERT OR IGNORE INTO users (username, email, password) VALUES (?, ?, ?)`,
            ['admin', 'admin@inventory.com', hash],
            function(err) {
                if (err) {
                    console.error('Error creating default user:', err);
                } else if (this.changes > 0) {
                    console.log('Default admin user created: username=admin, password=admin123');
                }
            }
        );
    });
}

// Authentication middleware
function authenticateToken(req, res, next) {
    const token = req.cookies.token || req.headers['authorization'];
    
    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(400).json({ error: 'Invalid token.' });
    }
}

// Routes

// Serve login page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Serve dashboard (protected)
app.get('/dashboard', authenticateToken, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Serve add product page (protected)
app.get('/add', authenticateToken, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'add.html'));
});

// Serve search page (protected)
app.get('/search', authenticateToken, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'search.html'));
});

// Serve report page (protected)
app.get('/report', authenticateToken, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'report.html'));
});

// Auth routes
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        db.run(`INSERT INTO users (username, email, password) VALUES (?, ?, ?)`,
            [username, email, hashedPassword],
            function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        return res.status(400).json({ error: 'Username or email already exists' });
                    }
                    return res.status(500).json({ error: 'Server error' });
                }
                
                const token = jwt.sign({ id: this.lastID, username }, JWT_SECRET);
                res.cookie('token', token, { httpOnly: true });
                res.json({ message: 'User registered successfully', token });
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Server error' });
        }
        
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        try {
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.status(400).json({ error: 'Invalid credentials' });
            }

            const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
            res.cookie('token', token, { httpOnly: true });
            res.json({ message: 'Login successful', token });
        } catch (error) {
            res.status(500).json({ error: 'Server error' });
        }
    });
});

app.post('/api/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
});

// Product routes (protected)
app.get('/api/products', authenticateToken, (req, res) => {
    db.all(`SELECT * FROM products ORDER BY created_at DESC`, (err, products) => {
        if (err) {
            return res.status(500).json({ error: 'Server error' });
        }
        res.json(products);
    });
});

app.get('/api/products/search/:name', authenticateToken, (req, res) => {
    const { name } = req.params;
    db.all(`SELECT * FROM products WHERE name LIKE ? ORDER BY created_at DESC`, 
        [`%${name}%`], (err, products) => {
        if (err) {
            return res.status(500).json({ error: 'Server error' });
        }
        res.json(products);
    });
});

// UPDATED POST ROUTE - Always uses next consecutive ID
app.post('/api/products', authenticateToken, (req, res) => {
    const { name, quantity, price } = req.body;
    
    if (!name || quantity === undefined || price === undefined) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    if (quantity < 0 || price < 0) {
        return res.status(400).json({ error: 'Quantity and price must be positive numbers' });
    }

    // Get the next consecutive ID (highest ID + 1)
    db.get(`SELECT MAX(id) as maxId FROM products`, (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Server error' });
        }
        
        const nextId = (result.maxId || 0) + 1;
        
        // Insert with the next consecutive ID
        db.run(`INSERT INTO products (id, name, quantity, price) VALUES (?, ?, ?, ?)`,
            [nextId, name, parseInt(quantity), parseFloat(price)],
            function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Server error' });
                }
                
                db.get(`SELECT * FROM products WHERE id = ?`, [nextId], (err, product) => {
                    if (err) {
                        return res.status(500).json({ error: 'Server error' });
                    }
                    res.json({ message: 'Product added successfully', product });
                });
            }
        );
    });
});

app.put('/api/products/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { name, quantity, price } = req.body;
    
    if (!name || quantity === undefined || price === undefined) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    if (quantity < 0 || price < 0) {
        return res.status(400).json({ error: 'Quantity and price must be positive numbers' });
    }

    db.run(`UPDATE products SET name = ?, quantity = ?, price = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [name, parseInt(quantity), parseFloat(price), id],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Server error' });
            }
            
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Product not found' });
            }
            
            db.get(`SELECT * FROM products WHERE id = ?`, [id], (err, product) => {
                if (err) {
                    return res.status(500).json({ error: 'Server error' });
                }
                res.json({ message: 'Product updated successfully', product });
            });
        }
    );
});

app.delete('/api/products/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    
    db.run(`DELETE FROM products WHERE id = ?`, [id], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Server error' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        // After deleting, renumber all products to be consecutive (1, 2, 3, etc.)
        db.all(`SELECT * FROM products ORDER BY id ASC`, (err, products) => {
            if (err) {
                return res.status(500).json({ error: 'Server error' });
            }
            
            // Renumber products to be consecutive starting from 1
            let updatePromises = [];
            products.forEach((product, index) => {
                const newId = index + 1;
                if (product.id !== newId) {
                    updatePromises.push(new Promise((resolve, reject) => {
                        db.run(`UPDATE products SET id = ? WHERE id = ?`, [newId, product.id], function(updateErr) {
                            if (updateErr) {
                                reject(updateErr);
                            } else {
                                resolve();
                            }
                        });
                    }));
                }
            });
            
            // Wait for all updates to complete
            Promise.all(updatePromises)
                .then(() => {
                    res.json({ message: 'Product deleted successfully and IDs reorganized' });
                })
                .catch((updateErr) => {
                    console.error('Error reorganizing IDs:', updateErr);
                    res.json({ message: 'Product deleted successfully but failed to reorganize IDs' });
                });
        });
    });
});

// Check auth status
app.get('/api/auth/check', authenticateToken, (req, res) => {
    res.json({ authenticated: true, user: req.user });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Default login: username=admin, password=admin123`);
});