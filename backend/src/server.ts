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
  windowMs: 15 * 60 * 1000, 
  max: 100 
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    message: 'CivicPulse API is running',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../../Frontend/dist');
  app.use(express.static(frontendPath));
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
} else {
  // Serve static files in development
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
  
  app.get('/', (req: Request, res: Response) => {
    res.send('CivicPulse API is running in development mode. Use the frontend dev server for UI.');
  });
}

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
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
