require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./config/db');
const healthRoutes = require('./routes/health');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', healthRoutes);
app.use('/api', userRoutes);

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  
  // Test database connection
  try {
    await pool.query('SELECT NOW()');
    console.log('📦 Database connected successfully');
  } catch (err) {
    console.warn('⚠️  Database not connected:', err.message);
  }
});
