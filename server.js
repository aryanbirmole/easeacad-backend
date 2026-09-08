const express = require('express');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const searchRoutes = require('./routes/search');
const subjectRoutes = require('./routes/subjects');
const noteRoutes = require('./routes/notes');   
const taskRoutes = require('./routes/tasks');
const importantDatesRoutes = require('./routes/importantDates');
const attachmentRoutes = require('./routes/attachments');
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/subjects', subjectRoutes);    
app.use('/api/notes', noteRoutes);
app.use('/api/tasks', taskRoutes); 
app.use('/api/important-dates', importantDatesRoutes);
app.use('/api/dashboard', dashboardRoutes);  
app.use('/api/search', searchRoutes);
app.use('/api/attachments', attachmentRoutes);

app.get('/hello', (req, res) => {
  res.status(200).json({ success: true, message: 'Backend is working!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});