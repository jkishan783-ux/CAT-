import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import apiRouter from './routes/api';
import { errorHandler } from './middleware/errorMiddleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cat_prep';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS Whitelist Profile checking
app.use((req, res, next) => {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map((o) => o.trim());
  const origin = req.headers.origin;
  
  if (origin) {
    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ error: 'CORS policy blocked access from this origin.' });
      }
    }
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Routing API
app.use('/api', apiRouter);

// Global Error Handler Middleware
app.use(errorHandler);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Database and Server Start (only if not running Jest tests)
if (process.env.NODE_ENV !== 'test') {
  mongoose
    .connect(MONGODB_URI)
    .then(() => {
      console.log('Successfully connected to MongoDB.');
      app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error('MongoDB connection error:', err);
    });
}

export default app;
