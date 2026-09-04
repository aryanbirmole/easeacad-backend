const express = require('express');
const router = express.Router();
const db = require('../db');
const verifyToken = require('../middleware/auth');

async function verifySubjectOwnership(subjectId, userId) {
  const [rows] = await db.query(
    'SELECT id FROM subjects WHERE id = ? AND user_id = ?',
    [subjectId, userId]
  );
  return rows.length > 0;
}

// GET /api/important-dates?subject_id=X
router.get('/', verifyToken, async (req, res) => {
  const { subject_id } = req.query;
  if (!subject_id) return res.status(400).json({ error: 'subject_id is required' });

  const owns = await verifySubjectOwnership(subject_id, req.userId);
  if (!owns) return res.status(404).json({ error: 'Subject not found' });

  const [dates] = await db.query(
    'SELECT * FROM important_dates WHERE subject_id = ? ORDER BY event_date ASC',
    [subject_id]
  );
  res.json(dates);
});

// GET /api/important-dates/upcoming?days=7  (for Dashboard "Coming Up" widget)
router.get('/upcoming', verifyToken, async (req, res) => {
  const days = parseInt(req.query.days) || 7;

  const [dates] = await db.query(
    `SELECT important_dates.*, subjects.name AS subject_name
     FROM important_dates
     JOIN subjects ON important_dates.subject_id = subjects.id
     WHERE subjects.user_id = ?
       AND important_dates.is_done = FALSE
       AND important_dates.event_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
     ORDER BY important_dates.event_date ASC
     LIMIT 5`,
    [req.userId, days]
  );
  res.json(dates);
});

// POST /api/important-dates
router.post('/', verifyToken, async (req, res) => {
  const { subject_id, title, event_date } = req.body;
  if (!subject_id || !title || !event_date) {
    return res.status(400).json({ error: 'subject_id, title, and event_date are required' });
  }

  const owns = await verifySubjectOwnership(subject_id, req.userId);
  if (!owns) return res.status(404).json({ error: 'Subject not found' });

  const [result] = await db.query(
    'INSERT INTO important_dates (subject_id, title, event_date) VALUES (?, ?, ?)',
    [subject_id, title, event_date]
  );
  res.status(201).json({ id: result.insertId, subject_id, title, event_date, is_done: false });
});

// PUT /api/important-dates/:id  (partial update, same pattern as Tasks)
router.put('/:id', verifyToken, async (req, res) => {
  const { title, event_date, is_done } = req.body;

  const [rows] = await db.query(
    `SELECT important_dates.id FROM important_dates
     JOIN subjects ON important_dates.subject_id = subjects.id
     WHERE important_dates.id = ? AND subjects.user_id = ?`,
    [req.params.id, req.userId]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Date not found' });

  const fields = [];
  const values = [];
  if (title !== undefined) { fields.push('title = ?'); values.push(title); }
  if (event_date !== undefined) { fields.push('event_date = ?'); values.push(event_date); }
  if (is_done !== undefined) { fields.push('is_done = ?'); values.push(is_done); }

  if (fields.length === 0) return res.status(400).json({ error: 'No fields provided to update' });

  values.push(req.params.id);
  await db.query(`UPDATE important_dates SET ${fields.join(', ')} WHERE id = ?`, values);
  res.json({ message: 'Date updated' });
});

// DELETE /api/important-dates/:id
router.delete('/:id', verifyToken, async (req, res) => {
  const [rows] = await db.query(
    `SELECT important_dates.id FROM important_dates
     JOIN subjects ON important_dates.subject_id = subjects.id
     WHERE important_dates.id = ? AND subjects.user_id = ?`,
    [req.params.id, req.userId]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Date not found' });

  await db.query('DELETE FROM important_dates WHERE id = ?', [req.params.id]);
  res.json({ message: 'Date deleted' });
});

module.exports = router;