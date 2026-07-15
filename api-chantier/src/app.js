import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './shared/middleware/errorHandler.js';
import { correlationId } from './shared/middleware/correlationId.js';

import healthRoutes from './modules/health/routes.js';
import authRoutes from './modules/auth/routes.js';
import usersRoutes from './modules/users/routes.js';
import chantiersRoutes from './modules/chantiers/routes.js';
import affectationsRoutes from './modules/affectations/routes.js';
import zonesRoutes from './modules/zones/routes.js';
import timesheetRoutes from './modules/timesheet/routes.js';
import validationRoutes from './modules/validation/routes.js';
import exportRoutes from './modules/export/routes.js';
import { realtimeRoutes, initRealtime } from './modules/realtime/index.js';

export function createApp(options = {}) {
  initRealtime({ heartbeatMs: options.sseHeartbeatMs });

  const app = express();

  app.disable('x-powered-by');
  app.use(correlationId);
  app.use(helmet({
    // SSE streams must not be cached / CSP-blocked for EventSource clients
    contentSecurityPolicy: false,
  }));
  app.use(
    cors({
      origin: env.corsOrigin === '*' ? true : env.corsOrigin.split(',').map((s) => s.trim()),
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(
    morgan(env.isProd ? 'combined' : 'dev', {
      stream: {
        write: (msg) => {
          // morgan already includes newline
          process.stdout.write(msg);
        },
      },
    }),
  );
  app.get('/', (_req, res) => {
    res.json({
      name: 'api-chantier',
      version: '0.1.0',
      docs: 'See README.md — modular Express + PostgreSQL',
    });
  });

  app.use('/health', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/chantiers', chantiersRoutes);
  app.use('/api/affectations', affectationsRoutes);
  app.use('/api/zones', zonesRoutes);
  app.use('/api/timesheet', timesheetRoutes);
  app.use('/api/validation', validationRoutes);
  app.use('/api/export', exportRoutes);
  app.use('/events', realtimeRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
