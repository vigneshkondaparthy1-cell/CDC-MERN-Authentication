import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import profileRoutes from './routes/profile.js';
import managementRoutes from './routes/accountManagement.js';
import directoryToolsRoutes from './routes/directoryTools.js';
import campusRoutes from './routes/campus.js';
import recoveryRoutes from './routes/recovery.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';

const app = express();

app.disable('x-powered-by');

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

app.use('/api/auth/login', express.json({ limit: '32kb' }));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

app.use('/api/auth/login', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many attempts. Try again later.' }
}));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', managementRoutes);
app.use('/api/admin', directoryToolsRoutes);
app.use('/api/campus', campusRoutes);
app.use('/api/recovery', recoveryRoutes);

app.use('/api', (_req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

// Serve React only after all API routes.
if (process.env.NODE_ENV === 'production') {
  const clientDist = fileURLToPath(
    new URL('../../client/dist/', import.meta.url)
  );

  app.use(express.static(clientDist));

  app.get('*', (_req, res) => {
    res.sendFile(`${clientDist}/index.html`);
  });
}

app.use((err, _req, res, _next) => {
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'value';
    return res.status(409).json({
      message: `This ${field} already exists`
    });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid JSON body' });
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request body too large' });
  }

  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

export default app;
