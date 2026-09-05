const express = require('express');
const router = express.Router();
const db = require('../db');
const verifyToken = require('../middleware/auth');

// confirms the note belongs to the logged-in user, and returns its subject_id
async function verifyNoteOwnership(noteId, userId) {
  const [rows] = await db.query(
    `SELECT notes.subject_id FROM notes
     JOIN subjects ON notes.subject_id = subjects.id
     WHERE notes.id = ? AND subjects.user_id = ?`,
    [noteId, userId]
  );
  return rows.length > 0 ? rows[0].subject_id : null;
}

// GET /api/attachments?note_id=X
router.get('/', verifyToken, async (req, res) => {
  const { note_id } = req.query;
  if (!note_id) {
    return res.status(400).json({ error: 'note_id is required' });
  }

  const subjectId = await verifyNoteOwnership(note_id, req.userId);
  if (!subjectId) {
    return res.status(404).json({ error: 'Note not found' });
  }

  const [attachments] = await db.query(
    'SELECT * FROM attachments WHERE note_id = ? ORDER BY created_at DESC',
    [note_id]
  );
  res.json(attachments);
});

// POST /api/attachments
router.post('/', verifyToken, async (req, res) => {
  const { note_id, type, url, title } = req.body;
  if (!note_id || !type || !url) {
    return res.status(400).json({ error: 'note_id, type, and url are required' });
  }
  if (!['image', 'pdf', 'video_link'].includes(type)) {
    return res.status(400).json({ error: 'Invalid type' });
  }

  const subjectId = await verifyNoteOwnership(note_id, req.userId);
  if (!subjectId) {
    return res.status(404).json({ error: 'Note not found' });
  }

  const [result] = await db.query(
    'INSERT INTO attachments (subject_id, note_id, type, url, title) VALUES (?, ?, ?, ?, ?)',
    [subjectId, note_id, type, url, title || null]
  );

  res.status(201).json({
    id: result.insertId,
    subject_id: subjectId,
    note_id,
    type,
    url,
    title: title || null,
  });
});

// DELETE /api/attachments/:id
router.delete('/:id', verifyToken, async (req, res) => {
  const [rows] = await db.query(
    `SELECT attachments.id FROM attachments
     JOIN notes ON attachments.note_id = notes.id
     JOIN subjects ON notes.subject_id = subjects.id
     WHERE attachments.id = ? AND subjects.user_id = ?`,
    [req.params.id, req.userId]
  );
  if (rows.length === 0) {
    return res.status(404).json({ error: 'Attachment not found' });
  }

  await db.query('DELETE FROM attachments WHERE id = ?', [req.params.id]);
  res.json({ message: 'Attachment deleted' });
});

module.exports = router;