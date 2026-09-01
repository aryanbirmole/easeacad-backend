const express = require('express');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/auth');
const subjectRoutes = require('./routes/subjects');   // ← add this

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/subjects', subjectRoutes);                // ← add this

app.get('/hello', (req, res) => {
  res.status(200).json({ success: true, message: 'Backend is working!' });
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on http://localhost:${process.env.PORT}`);
});