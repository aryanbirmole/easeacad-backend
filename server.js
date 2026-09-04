const express = require('express');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/auth');
const subjectRoutes = require('./routes/subjects');
const noteRoutes = require('./routes/notes');   
const taskRoutes = require('./routes/tasks');
const importantDatesRoutes = require('./routes/importantDates');
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/subjects', subjectRoutes);    
app.use('/api/notes', noteRoutes);
app.use('/api/tasks', taskRoutes); 
app.use('/api/important-dates', importantDatesRoutes);           

app.get('/hello', (req, res) => {
  res.status(200).json({ success: true, message: 'Backend is working!' });
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on http://localhost:${process.env.PORT}`);
});