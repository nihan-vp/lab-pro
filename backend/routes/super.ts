import express from 'express';
import bcrypt from 'bcryptjs';
import { User, Lab } from '../models.ts';
import { getLabModels } from '../database.ts';
import { authenticateToken, isSuperAdmin } from '../middleware.ts';

const router = express.Router();

router.get('/labs', authenticateToken, isSuperAdmin, async (req, res) => {
  const labs = await Lab.find();
  res.json(labs);
});

router.post('/labs', authenticateToken, isSuperAdmin, async (req, res) => {
  const lab = await Lab.create(req.body);
  res.json(lab);
});

router.put('/labs/:id', authenticateToken, isSuperAdmin, async (req, res) => {
  const lab = await Lab.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(lab);
});

router.get('/admins', authenticateToken, isSuperAdmin, async (req, res) => {
  const admins = await User.find({ role: 'admin' }).populate('labId');
  res.json(admins);
});

router.post('/admins', authenticateToken, isSuperAdmin, async (req, res) => {
  const { username, password, name, labId } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const admin = await User.create({
    username, password: hashedPassword, role: 'admin', name, labId
  });
  res.json(admin);
});

router.put('/admins/:id', authenticateToken, isSuperAdmin, async (req, res) => {
  const { username, password, name, labId } = req.body;
  const updateData: any = { username, name, labId };
  if (password) {
    updateData.password = await bcrypt.hash(password, 10);
  }
  const admin = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });
  res.json(admin);
});

router.delete('/labs/:id', authenticateToken, isSuperAdmin, async (req, res) => {
  await Lab.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

router.delete('/admins/:id', authenticateToken, isSuperAdmin, async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

router.post('/sync-tests/:labId', authenticateToken, isSuperAdmin, async (req, res) => {
  const { labId } = req.params;
  try {
    const labInfo = await Lab.findById(labId);
    if (!labInfo) return res.status(404).json({ error: 'Lab not found' });

    const targetModels = await getLabModels(labId, labInfo.dbUri);
    
    const testCount = await targetModels.Test.countDocuments();
    if (testCount > 0) {
      return res.status(400).json({ error: 'Laboratory already has a test directory established.' });
    }

    const masterModels = await getLabModels('master');
    const masterTests = await masterModels.Test.find();
    if (masterTests.length === 0) {
      return res.status(400).json({ error: 'No master test directory found to synchronize.' });
    }

    const newTests = masterTests.map(t => {
      const obj = t.toObject();
      delete obj._id;
      delete obj.__v;
      delete obj.created_at;
      return obj;
    });

    await targetModels.Test.insertMany(newTests);
    res.json({ success: true, count: newTests.length });
  } catch (err) {
    console.error('Test Sync Failed:', err);
    res.status(500).json({ error: 'Failed to synchronize clinical test directory.' });
  }
});

export default router;
