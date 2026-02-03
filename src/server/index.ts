// ============================================
// Server Entry Point
// Express server configuration and routes
// ============================================

import express from 'express';
import cors from 'cors';
import usersRouter from './api/users';
import projectsRouter from './api/projects';
// API keys router will be added during demo

const app = express();
const PORT = process.env.PORT || 3001;

// --------------------------------------------
// Middleware
// --------------------------------------------

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));

app.use(express.json());

// Request logging
app.use((req, _res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// --------------------------------------------
// Routes
// --------------------------------------------

app.use('/api/users', usersRouter);
app.use('/api/projects', projectsRouter);
// app.use('/api/api-keys', apiKeysRouter); // Will be added during demo

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// --------------------------------------------
// Error Handling
// --------------------------------------------

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
    },
  });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
});

// --------------------------------------------
// Start Server
// --------------------------------------------

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║     DevKit Platform API Server         ║
║     http://localhost:${PORT}              ║
╚════════════════════════════════════════╝
  `);
});

export default app;
