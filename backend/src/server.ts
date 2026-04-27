import express, { Express, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import connectDB from './config/db';

// Import Routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import issueRoutes from './routes/issues';
import feedbackRoutes from './routes/feedback';
import analyticsRoutes from './routes/analytics';

dotenv.config();

// Initialize DB connection
connectDB();

const app: Express = express();
const PORT = parseInt(process.env.PORT || '5001', 10);
const HOST = '0.0.0.0';

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // Increased limit to prevent 429 errors during development
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',') 
    : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist (wrap in try-catch for read-only environments like Vercel)
const uploadsDir = path.join(__dirname, '../uploads');
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (error: any) {
  console.warn('⚠️ Could not create uploads directory (this is expected in Vercel/serverless environments):', error.message);
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/analytics', analyticsRoutes);

// API Root / Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    message: 'CivicPulse API is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'CivicPulse Backend API is online. Please use /api prefix.' });
});

// Serve static files (uploads only)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Error handling middleware
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  console.error('❌ Error:', error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: Object.values(error.errors).map((err: any) => err.message)
    });
  }
  
  if (error.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Duplicate entry',
      field: Object.keys(error.keyValue)[0]
    });
  }
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal Server Error'
  });
});

const server = app.listen(PORT, HOST, () => {
  const address = server.address();
  const bind = typeof address === 'string' ? `pipe ${address}` : `port ${address?.port}`;
  console.log(`🚀 CivicPulse server running on ${HOST}:${PORT} (${bind})`);
  console.log(`📊 Health check: http://127.0.0.1:${PORT}/api/health`);
});
