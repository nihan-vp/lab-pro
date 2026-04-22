import express from 'express';
import 'express-async-errors';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './database.js';

// Import Routes
import authRoutes from './routes/auth.ts';
import superRoutes from './routes/super.ts';
import labRoutes from './routes/lab.ts';

dotenv.config();

async function startServer() {
  // Initialize MongoDB Connection (Master/Superadmin Cluster)
  await connectDB();
  
  const app = express();
  const PORT = 3000;

  // Basic Middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.json());
  app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://lab.nihan-vp.me"
  ],
  credentials: true
}));

  // --- API Routes ---
  // Mount authentication routes (login, register)
  app.use('/api/auth', authRoutes);
  
  // Mount superadmin management routes (lab orchestration)
  app.use('/api/super', superRoutes);
  
  // Mount core laboratory routes (patients, tests, bookings, results)
  // These use the 'withLab' middleware for multi-tenant DB switching
  app.use('/api', labRoutes);

  // API Health Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API 404 handler - Prevents API requests from falling through to the SPA index.html
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.originalUrl}` });
  });

  // --- Static Assets & Frontend Integration ---
  
  if (process.env.NODE_ENV !== 'production') {
    // Development Mode: Use Vite's middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite development middleware enabled');
  } else {
    // Production Mode: Serve static files from /dist
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    // SPA Fallback: All non-API routes serve index.html
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log(`Serving static assets from: ${distPath}`);
  }

  // --- Global Error Handling ---
  app.use((err: any, req: any, res: any, next: any) => {
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';
    
    if (status >= 500) {
      console.error('SERVER ERROR:', err);
    }

    res.status(status).json({ 
      error: message,
      details: process.env.NODE_ENV !== 'production' ? err.stack : undefined
    });
  });

  // Start the server
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`
🚀 BioLab Pro Server Started
----------------------------
URL:  http://localhost:${PORT}
Mode: ${process.env.NODE_ENV || 'development'}
Port: ${PORT}
    `);
  });
}

startServer();
