import express from 'express';
import dotenv from 'dotenv';
import verificationRoutes from './routes/verificationRoutes';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { testFirebaseConnection } from './config/firebase';
import { cleanupExpiredCodes } from './utils/cleanup';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Test Firebase connection on startup
testFirebaseConnection().catch(error => {
  console.error('Failed to connect to Firebase:', error);
  process.exit(1);
});

// Middleware
app.use(express.json());

// Apply rate limiter to verification routes
app.use('/api/verification', rateLimiter);

// Routes
app.use('/api/verification', verificationRoutes);

// Root route
app.get('/', (_req, res) => {
  res.json({
    name: 'Email Verification API',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use(errorHandler);

// Start cleanup routine
const CLEANUP_INTERVAL = 15 * 60 * 1000; // 15 minutes
setInterval(async () => {
  try {
    const cleanedCount = await cleanupExpiredCodes();
    if (cleanedCount > 0) {
      console.log(`Cleanup routine: removed ${cleanedCount} expired codes`);
    }
  } catch (error) {
    console.error('Error in cleanup routine:', error);
  }
}, CLEANUP_INTERVAL);

// Start server
const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
