const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize SQLite database
const dbPath = path.join(__dirname, 'incidents.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// Create incidents table if it doesn't exist
const createTableSql = `
CREATE TABLE IF NOT EXISTS incidents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  description TEXT,
  category TEXT,
  location TEXT,
  reporterName TEXT,
  reporterEmail TEXT,
  studentName TEXT,
  dateTime TEXT,
  createdAt TEXT
)`;
db.run(createTableSql);

// Routes

// Get all incidents
app.get('/api/incidents', (req, res) => {
  db.all('SELECT * FROM incidents ORDER BY datetime(dateTime) DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch incidents' });
    }
    res.json(rows);
  });
});

// Get incident by ID
app.get('/api/incidents/:id', (req, res) => {
  db.get('SELECT * FROM incidents WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch incident' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    res.json(row);
  });
});

// Create new incident
app.post('/api/incidents', (req, res) => {
  const { title, description, category, location, reporterName, reporterEmail, studentName, dateTime } = req.body;
  const createdAt = new Date().toISOString();
  const sql = `INSERT INTO incidents (title, description, category, location, reporterName, reporterEmail, studentName, dateTime, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const params = [title, description, category, location, reporterName, reporterEmail, studentName, dateTime, createdAt];
  db.run(sql, params, function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to create incident' });
    }
    db.get('SELECT * FROM incidents WHERE id = ?', [this.lastID], (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch created incident' });
      }
      res.status(201).json(row);
    });
  });
});

// Update incident
app.put('/api/incidents/:id', (req, res) => {
  const { title, description, category, location, reporterName, reporterEmail, studentName, dateTime } = req.body;
  const sql = `UPDATE incidents SET title = ?, description = ?, category = ?, location = ?, reporterName = ?, reporterEmail = ?, studentName = ?, dateTime = ? WHERE id = ?`;
  const params = [title, description, category, location, reporterName, reporterEmail, studentName, dateTime, req.params.id];
  db.run(sql, params, function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to update incident' });
    }
    db.get('SELECT * FROM incidents WHERE id = ?', [req.params.id], (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch updated incident' });
      }
      res.json(row);
    });
  });
});

// Delete incident
app.delete('/api/incidents/:id', (req, res) => {
  db.run('DELETE FROM incidents WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete incident' });
    }
    res.status(204).send();
  });
});

// Get dashboard statistics
app.get('/api/dashboard/stats', (req, res) => {
  db.all('SELECT * FROM incidents', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch statistics' });
    }
    const stats = {
      total: rows.length,
      open: rows.filter(i => i.status === 'open').length,
      investigating: rows.filter(i => i.status === 'investigating').length,
      resolved: rows.filter(i => i.status === 'resolved').length
    };
    res.json(stats);
  });
});

// Get recent incidents
app.get('/api/dashboard/recent', (req, res) => {
  db.all('SELECT * FROM incidents ORDER BY datetime(createdAt) DESC LIMIT 5', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch recent incidents' });
    }
    res.json(rows);
  });
});

// Get existing reporter names for AI parsing
app.get('/api/reporters', (req, res) => {
  db.all('SELECT DISTINCT reporterName, reporterEmail FROM incidents WHERE reporterName IS NOT NULL AND reporterName != ""', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch reporter names' });
    }
    res.json(rows);
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const parseAiRouter = require('./parse-ai');
app.use('/api', parseAiRouter);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`API base URL: http://localhost:${PORT}/api`);
}); 