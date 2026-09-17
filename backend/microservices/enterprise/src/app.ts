import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'enterprise-platform', timestamp: new Date().toISOString() });
});

import identityRoutes from './modules/identity';
import organizationRoutes from './modules/organizations';
import campaignRoutes from './modules/campaigns';
import creativeRoutes from './modules/creatives';
import targetingRoutes from './modules/targeting';
import adRoutes from './modules/ads';
import analyticsRoutes from './modules/analytics';
import billingRoutes from './modules/billing';
import adminRoutes from './modules/admin';

// Modular Routes
app.use('/api/v1/identity', identityRoutes);
app.use('/api/v1/organizations', organizationRoutes);
app.use('/api/v1/campaigns', campaignRoutes);
app.use('/api/v1/creatives', creativeRoutes);
app.use('/api/v1/targeting', targetingRoutes);
app.use('/api/v1/ads', adRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/billing', billingRoutes);
app.use('/api/v1/admin', adminRoutes);

// Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[Error]', err.message);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

export default app;
