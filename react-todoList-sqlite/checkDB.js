const sqlite3 = require('sqlite3').verbose();

// Open the database
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    return;
  }
  console.log('Connected to SQLite database');
});

// Query to get all tables
db.serialize(() => {
  console.log('Checking tables in database...');
  
  db.each("SELECT name FROM sqlite_master WHERE type='table';", (err, row) => {
    if (err) {
      console.error('Error querying tables:', err.message);
    } else {
      console.log('Table:', row.name);
      
      // For each table, count records
      db.get(`SELECT COUNT(*) as count FROM ${row.name};`, (err, countRow) => {
        if (err) {
          console.error(`Error counting records in ${row.name}:`, err.message);
        } else {
          console.log(`  Records in ${row.name}:`, countRow.count);
        }
      });
    }
  });
});

// Close the database after a delay to allow queries to complete
setTimeout(() => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed');
    }
  });
}, 2000);