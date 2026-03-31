const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/health', async (req, res) => {
  let database = false;
  try {
    await pool.query('SELECT 1');
    database = true;
  } catch {}

  res.json({
    status: 'ok',
    message: 'Backend is running!',
    timestamp: new Date().toISOString(),
    database
  });
});

module.exports = router;
