import express from 'express';
import 'express-async-errors';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './database.ts';

// Routes
import authRoutes from './routes/auth.ts';
import superRoutes from './routes/super.ts';
import labRoutes from './routes/lab.ts';

dotenv.config();

async function startServer() {
  await connectDB();
  
  const app = express();
  const PORT = 3000;

  app.use(express.json());
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://lab.nihan-vp.me"
  ],
  credentials: true
}));


  // Mount API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/super', superRoutes);
  app.use('/api', labRoutes); // Patients, Tests, etc.

  // API 404 handler - Ensure API errors return JSON, not HTML
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.originalUrl}` });
  });

  app.all('/api', (req, res) => {
    res.status(404).json({ error: 'API base endpoint not found. Use specific resources.' });
  });

  // Global Error Handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('SERVER ERROR:', err);
    res.status(err.status || 500).json({ 
      error: err.message || 'Internal Server Error',
      details: process.env.NODE_ENV !== 'production' ? err.stack : undefined
    });
  });

  // Vite/Production middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
  app.get('/api/debug', (req, res) => {
  res.json({ ok: true, message: 'new backend is live' });
});
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
