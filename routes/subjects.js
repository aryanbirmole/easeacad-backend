const express = require('express');
const pool = require('../db');
const verifyToken = require('../middleware/auth');

const router = express.Router();

// GET all subjects for the user
router.get('/', verifyToken, async (req, res) => {
  try {
    const [subjects] = await pool.query(
      'SELECT * FROM subjects WHERE user_id = ? ORDER BY created_at DESC',
      [req.userId]
    );
    res.status(200).json({ success: true, subjects });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET a specific subject by ID for the user
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const [subjects] = await pool.query(
      'SELECT * FROM subjects WHERE id = ? AND user_id = ?',
      [id, req.userId]
    );
    if (subjects.length === 0) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }
    res.status(200).json({ success: true, subject: subjects[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// CREATE a new subject
router.post('/', verifyToken, async (req, res) => {
  try {
    const { name, color } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Subject name is required' });
    }

    const [result] = await pool.query(
      'INSERT INTO subjects (user_id, name, color) VALUES (?, ?, ?)',
      [req.userId, name.trim(), color || '#4f46e5']
    );

    res.status(201).json({
      success: true,
      subject: { id: result.insertId, name: name.trim(), color: color || '#4f46e5' },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// UPDATE subject (rename, change color)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { name, color } = req.body;
    const { id } = req.params;

    // confirm this subject belongs to the logged-in user before updating
    const [existing] = await pool.query(
      'SELECT * FROM subjects WHERE id = ? AND user_id = ?',
      [id, req.userId]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    await pool.query(
      'UPDATE subjects SET name = ?, color = ? WHERE id = ?',
      [name || existing[0].name, color || existing[0].color, id]
    );

    res.status(200).json({ success: true, message: 'Subject updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE subject
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query(
      'SELECT * FROM subjects WHERE id = ? AND user_id = ?',
      [id, req.userId]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    await pool.query('DELETE FROM subjects WHERE id = ?', [id]);

    res.status(200).json({ success: true, message: 'Subject deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;