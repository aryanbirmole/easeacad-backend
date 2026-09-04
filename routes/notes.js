const express = require('express');
const pool = require('../db');
const verifyToken = require('../middleware/auth');

const router = express.Router();

// confirms the subject belongs to the logged-in user before touching its notes
async function verifySubjectOwnership(subjectId, userId) {
  const [subjects] = await pool.query(
    'SELECT id FROM subjects WHERE id = ? AND user_id = ?',
    [subjectId, userId]
  );
  return subjects.length > 0;
}

router.get('/', verifyToken, async (req, res) => {
  try {
    const { subject_id } = req.query;
    if (!subject_id) {
      return res.status(400).json({ success: false, message: 'subject_id is required' });
    }

    const owns = await verifySubjectOwnership(subject_id, req.userId);
    if (!owns) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    const [notes] = await pool.query(
      'SELECT * FROM notes WHERE subject_id = ? ORDER BY pinned DESC, created_at DESC',
      [subject_id]
    );
    res.status(200).json({ success: true, notes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const { subject_id, title, content, tags } = req.body;
    if (!subject_id || !title || title.trim() === '') {
      return res.status(400).json({ success: false, message: 'subject_id and title are required' });
    }

    const owns = await verifySubjectOwnership(subject_id, req.userId);
    if (!owns) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    const [result] = await pool.query(
      'INSERT INTO notes (subject_id, title, content, tags) VALUES (?, ?, ?, ?)',
      [subject_id, title.trim(), content || '', tags || '']
    );

    res.status(201).json({
      success: true,
      note: { id: result.insertId, subject_id, title: title.trim(), content, tags, pinned: false },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, tags, pinned } = req.body;

    // join to subjects since notes have no user_id column of their own
    const [existing] = await pool.query(
      `SELECT n.* FROM notes n
       JOIN subjects s ON n.subject_id = s.id
       WHERE n.id = ? AND s.user_id = ?`,
      [id, req.userId]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    const note = existing[0];
    await pool.query(
      'UPDATE notes SET title = ?, content = ?, tags = ?, pinned = ? WHERE id = ?',
      [
        title ?? note.title,
        content ?? note.content,
        tags ?? note.tags,
        pinned ?? note.pinned,
        id,
      ]
    );

    res.status(200).json({ success: true, message: 'Note updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query(
      `SELECT n.id FROM notes n
       JOIN subjects s ON n.subject_id = s.id
       WHERE n.id = ? AND s.user_id = ?`,
      [id, req.userId]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    await pool.query('DELETE FROM notes WHERE id = ?', [id]);
    res.status(200).json({ success: true, message: 'Note deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;