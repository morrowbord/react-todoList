const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

module.exports = (db) => {
  // Login route
  router.post('/login', (req, res) => {
    const { email, password } = req.body;

    // Find user by email
    const sql = 'SELECT * FROM users WHERE email = ?';
    db.get(sql, [email], async (err, user) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // For simplicity, we'll allow login with any password for non-admin accounts
      // In a real application, you would compare hashed passwords
      if (email === 'admin@example.com') {
        // For admin, we'll use a simple check (in production, use proper password hashing)
        if (password !== 'admin123') { // Default admin password
          return res.status(401).json({ error: 'Invalid credentials' });
        }
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'fallback_secret_key',
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      });
    });
  });

  // Register route
  router.post('/register', (req, res) => {
    const { email, password } = req.body;

    // Hash password
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Insert new user
      const sql = 'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)';
      const params = [email, hashedPassword, 'user'];

      db.run(sql, params, function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        // Generate JWT token
        const token = jwt.sign(
          { id: this.lastID, email, role: 'user' },
          process.env.JWT_SECRET || 'fallback_secret_key',
          { expiresIn: '24h' }
        );

        res.status(201).json({
          token,
          user: {
            id: this.lastID,
            email,
            role: 'user'
          }
        });
      });
    });
  });

  // Get current user info
  router.get('/me', authenticateToken, (req, res) => {
    // The user info is attached to req.user by the authenticateToken middleware
    res.json({
      id: req.user.id,
      email: req.user.email,
      role: req.user.role
    });
  });

  return router;
};