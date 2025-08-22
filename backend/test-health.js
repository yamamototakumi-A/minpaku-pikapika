const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8888;

// CORS configuration
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Health check endpoint (without database)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'Pikapika Backend is running (test mode)',
    timestamp: new Date().toISOString(),
    database: 'not connected',
    environment: 'test'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  console.log(`📡 Health check available at http://localhost:${PORT}/api/health`);
});
