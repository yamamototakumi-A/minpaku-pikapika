require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const { authenticateToken } = require('./middleware/auth');
const { prisma } = require('./config/prisma');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// CORS configuration - restrict to VPS IP and localhost
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://162.43.30.178:3000',
    'http://162.43.30.178',
    'https://162.43.30.178',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection via Prisma
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({ 
      status: 'ok',
      message: 'Pikapika Backend is running',
      timestamp: new Date().toISOString(),
      database: 'connected',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('Health check failed:', error.message);
    res.status(503).json({ 
      status: 'error',
      message: 'Backend is running but database connection failed',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// Protected route example
app.get('/api/protected', authenticateToken, (req, res) => {
  res.json({ message: 'This is a protected route', user: req.user });
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Ensure schema exists based on Prisma (no-op if already applied). Prefer running migrations externally.
    // Optionally uncomment next line if you want to ensure tables: await prisma.$executeRaw`SELECT 1`;
    app.listen(PORT, () => {
      console.log(`🚀 Pikapika Backend server running on port ${PORT}`);
      console.log(`📡 API available at http://162.43.30.178:${PORT}/api`);
      console.log(`🔒 JWT Secret configured: ${process.env.JWT_SECRET ? 'Yes' : 'No'}`);
      console.log(`🌐 CORS Origin: ${process.env.FRONTEND_URL || 'http://162.43.30.178:3000'}`);
      console.log(`💾 Database URL: ${process.env.DATABASE_URL ? 'configured' : 'missing'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
