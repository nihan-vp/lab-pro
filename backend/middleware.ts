import jwt from 'jsonwebtoken';
import { Lab } from './models.ts';
import { getLabModels, MONGODB_URI } from './database.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'f89c0e295327ba553a5a0400545b0400f6d5a69d4490b01ca7c2b444008a078999f81e1a5fe359c77fc06ed868bca2e6af7ae46a66c94cb0af8ba6bb7a9fe7a1';

export const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Authentication token required' });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

export const isSuperAdmin = (req: any, res: any, next: any) => {
  if (!req.user || req.user.role !== 'superadmin') return res.status(403).json({ error: 'Super Admin access required' });
  next();
};

export const isAdmin = (req: any, res: any, next: any) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'superadmin')) return res.status(403).json({ error: 'Admin access required' });
  next();
};

export const withLab = async (req: any, res: any, next: any) => {
  let labId = req.headers['x-lab-id'] || req.user?.labId;
  
  if (labId && typeof labId === 'object' && (labId as any)._id) {
     labId = (labId as any)._id.toString();
  } else if (labId) {
     labId = labId.toString();
  }

  try {
    let dbUri = MONGODB_URI;
    const isObjectId = (id: string) => /^[0-9a-fA-F]{24}$/.test(id);

    if (labId && labId !== 'master' && isObjectId(labId)) {
      const lab = await Lab.findById(labId);
      if (lab && lab.dbUri) {
        dbUri = lab.dbUri.trim();
      }
    }
    
    const models = await getLabModels(labId || 'master', dbUri);
    req.models = models;
    next();
  } catch (err) {
    console.error('Tenant DB Error:', err);
    res.status(500).json({ error: 'Database connection error for this laboratory instance.' });
  }
};
