const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize SQLite database
const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Create tables if they don't exist
db.serialize(() => {
  // Create users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    role TEXT DEFAULT 'user',
    telegram_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Create tasks table
  db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    completed BOOLEAN DEFAULT 0,
    priority TEXT DEFAULT 'idea',
    assignee TEXT,
    due_date TEXT,
    column_id TEXT DEFAULT 'todo',
    created_by INTEGER,
    archived BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users (id)
  )`);

  // Insert default admin user if not exists
  db.run(`INSERT OR IGNORE INTO users (email, password_hash, role) VALUES ('admin@example.com', '$2a$10$default.admin.password.hash', 'admin')`);
});

// Import routes and middleware
const createTaskRoutes = require('./routes/tasks');
const authRoutes = require('./routes/auth')(db);
const { authenticateToken } = require('./middleware/auth');

// Create task routes with database
const taskRoutes = createTaskRoutes(db);

// Routes
app.use('/api/auth', authRoutes);
// Protect task routes with authentication
app.use('/api/tasks', authenticateToken, taskRoutes);

// Serve static files from the React app (when built)
// Only serve build files if they exist
const buildPath = path.join(__dirname, 'build');
if(require('fs').existsSync(buildPath)) {
  app.use(express.static(buildPath));

  // The "catchall" handler: for any request that doesn't
  // match one above, send back React's index.html file.
  app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
} else {
  console.log('Build directory does not exist yet. Run "npm run build" to create it.');
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});