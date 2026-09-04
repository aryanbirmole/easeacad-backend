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

// GET /api/tasks?subject_id=X
router.get('/', verifyToken, async (req, res) => {
  const { subject_id } = req.query;
  if (!subject_id) return res.status(400).json({ error: 'subject_id is required' });

  const owns = await verifySubjectOwnership(subject_id, req.userId);
  if (!owns) return res.status(404).json({ error: 'Subject not found' });

  const [tasks] = await db.query(
    'SELECT * FROM tasks WHERE subject_id = ? ORDER BY due_date ASC',
    [subject_id]
  );
  res.json(tasks);
});

// POST /api/tasks
router.post('/', verifyToken, async (req, res) => {
  const { subject_id, note_id, title, due_date } = req.body;
  if (!subject_id || !title) {
    return res.status(400).json({ error: 'subject_id and title are required' });
  }

  const owns = await verifySubjectOwnership(subject_id, req.userId);
  if (!owns) return res.status(404).json({ error: 'Subject not found' });

  const [result] = await db.query(
    'INSERT INTO tasks (subject_id, note_id, title, due_date) VALUES (?, ?, ?, ?)',
    [subject_id, note_id || null, title, due_date || null]
  );
  res.status(201).json({ id: result.insertId, subject_id, title, due_date, status: 'pending' });
});

// PUT /api/tasks/:id (partial update)
router.put('/:id', verifyToken, async (req, res) => {
  const { title, due_date, status } = req.body;

  const [rows] = await db.query(
    `SELECT tasks.id FROM tasks
     JOIN subjects ON tasks.subject_id = subjects.id
     WHERE tasks.id = ? AND subjects.user_id = ?`,
    [req.params.id, req.userId]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Task not found' });

  const fields = [];
  const values = [];
  if (title !== undefined) { fields.push('title = ?'); values.push(title); }
  if (due_date !== undefined) { fields.push('due_date = ?'); values.push(due_date); }
  if (status !== undefined) { fields.push('status = ?'); values.push(status); }

  if (fields.length === 0) return res.status(400).json({ error: 'No fields provided to update' });

  values.push(req.params.id);
  await db.query(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`, values);
  res.json({ message: 'Task updated' });
});

// DELETE /api/tasks/:id
router.delete('/:id', verifyToken, async (req, res) => {
  const [rows] = await db.query(
    `SELECT tasks.id FROM tasks
     JOIN subjects ON tasks.subject_id = subjects.id
     WHERE tasks.id = ? AND subjects.user_id = ?`,
    [req.params.id, req.userId]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Task not found' });

  await db.query('DELETE FROM tasks WHERE id = ?', [req.params.id]);
  res.json({ message: 'Task deleted' });
});

module.exports = router;