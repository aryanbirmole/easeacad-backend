const express = require('express');
const router = express.Router();
const db = require('../db');
const verifyToken = require('../middleware/auth');

// GET /api/dashboard/stats
router.get('/stats', verifyToken, async (req, res) => {
  const [[{ total_subjects }]] = await db.query(
    'SELECT COUNT(*) AS total_subjects FROM subjects WHERE user_id = ?',
    [req.userId]
  );

  const [[{ pending_tasks }]] = await db.query(
    `SELECT COUNT(*) AS pending_tasks FROM tasks
     JOIN subjects ON tasks.subject_id = subjects.id
     WHERE subjects.user_id = ? AND tasks.status != 'completed'`,
    [req.userId]
  );

  const [[{ overdue_tasks }]] = await db.query(
    `SELECT COUNT(*) AS overdue_tasks FROM tasks
     JOIN subjects ON tasks.subject_id = subjects.id
     WHERE subjects.user_id = ? AND tasks.status != 'completed' AND tasks.due_date < CURDATE()`,
    [req.userId]
  );

  res.json({ total_subjects, pending_tasks, overdue_tasks });
});

// GET /api/dashboard/upcoming?days=7
router.get('/upcoming', verifyToken, async (req, res) => {
  const days = parseInt(req.query.days) || 7;

  const [dates] = await db.query(
    `SELECT important_dates.*, subjects.name AS subject_name
     FROM important_dates
     JOIN subjects ON important_dates.subject_id = subjects.id
     WHERE subjects.user_id = ?
       AND important_dates.is_done = 0
       AND important_dates.event_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
     ORDER BY important_dates.event_date ASC
     LIMIT 5`,
    [req.userId, days]
  );

  res.json(dates);
});

// GET /api/dashboard/this-week
router.get('/this-week', verifyToken, async (req, res) => {
  const [tasks] = await db.query(
    `SELECT tasks.*, subjects.name AS subject_name
     FROM tasks
     JOIN subjects ON tasks.subject_id = subjects.id
     WHERE subjects.user_id = ?
       AND tasks.status != 'completed'
       AND tasks.due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
     ORDER BY tasks.due_date ASC`,
    [req.userId]
  );

  const [dates] = await db.query(
    `SELECT important_dates.*, subjects.name AS subject_name
     FROM important_dates
     JOIN subjects ON important_dates.subject_id = subjects.id
     WHERE subjects.user_id = ?
       AND important_dates.is_done = 0
       AND important_dates.event_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
     ORDER BY important_dates.event_date ASC`,
    [req.userId]
  );

  res.json({ tasks, dates });
});

module.exports = router;