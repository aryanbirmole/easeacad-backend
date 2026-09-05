const express = require('express');
const router = express.Router();
const db = require('../db');
const verifyToken = require('../middleware/auth');

// GET /api/search?q=keyword
router.get('/', verifyToken, async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim() === '') {
    return res.status(400).json({ error: 'Search query is required' });
  }
  const term = `%${q.trim()}%`;

  const [subjects] = await db.query(
    'SELECT id, name FROM subjects WHERE user_id = ? AND name LIKE ?',
    [req.userId, term]
  );

  const [notes] = await db.query(
    `SELECT notes.id, notes.title, notes.subject_id, subjects.name AS subject_name
     FROM notes
     JOIN subjects ON notes.subject_id = subjects.id
     WHERE subjects.user_id = ? AND notes.title LIKE ?`,
    [req.userId, term]
  );

  const [tasks] = await db.query(
    `SELECT tasks.id, tasks.title, tasks.subject_id, subjects.name AS subject_name
     FROM tasks
     JOIN subjects ON tasks.subject_id = subjects.id
     WHERE subjects.user_id = ? AND tasks.title LIKE ?`,
    [req.userId, term]
  );

  const [dates] = await db.query(
    `SELECT important_dates.id, important_dates.title, important_dates.subject_id, subjects.name AS subject_name
     FROM important_dates
     JOIN subjects ON important_dates.subject_id = subjects.id
     WHERE subjects.user_id = ? AND important_dates.title LIKE ?`,
    [req.userId, term]
  );

  res.json({ subjects, notes, tasks, dates });
});

module.exports = router;