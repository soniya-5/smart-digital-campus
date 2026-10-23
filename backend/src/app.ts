import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import path from 'path';

import { errorHandler } from './middleware/errorHandler';
import { generalApiLimiter } from './middleware/rateLimiter';

import healthRoutes from './routes/healthRoutes';
import authRoutes from './routes/authRoutes';
import complaintRoutes from './routes/complaintRoutes';
import notificationRoutes from './routes/notificationRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import communityRoutes from './routes/communityRoutes';
import campusRoutes from './routes/campusRoutes';
import academicRoutes from './routes/academicRoutes';
import sosRoutes from './routes/sosRoutes';
import adminRoutes from './routes/adminRoutes';

export const app = express();

// Security HTTP headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive for local dev demo
      }
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '110mb' }));
app.use(express.urlencoded({ extended: true, limit: '110mb' }));

// Apply rate limiting to all API routes
app.use('/api', generalApiLimiter);

// Serve uploaded files statically
const uploadsPath = path.resolve(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

// API Route Mounts
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboards', dashboardRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/campus', campusRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/admin', adminRoutes);

// Centralized error handler
app.use(errorHandler);

export default app;
