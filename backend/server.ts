import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, Patient, Test, Booking, Result, Setting } from './models.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'f89c0e295327ba553a5a0400545b0400f6d5a69d4490b01ca7c2b444008a078999f81e1a5fe359c77fc06ed868bca2e6af7ae46a66c94cb0af8ba6bb7a9fe7a1';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://qwerty311980_db_user:8XggP8d16ZsHeffh@binformed.lfjrbxn.mongodb.net/lab-ms';
const VITE_API_URL = process.env.VITE_API_URL || 'https://lab-pro-2qns.onrender.com/';
async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Seed default data if needed
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash( 'admin123', 10);
      await User.create({
        username: 'admin',
        password: hashedPassword,
        role: 'admin',
        name: 'Administrator'
      });
      console.log('Seeded default admin');
    }

    const settingsCount = await Setting.countDocuments();
    if (settingsCount === 0) {
      const defaultSettings = [
        { key: 'labName', value: 'BioLab Diagnostics' },
        { key: 'logo', value: '' },
        { key: 'address', value: '123 Health Street, Medical District' },
        { key: 'phone', value: '+1 234 567 890' },
        { key: 'email', value: 'info@biolab.com' },
        { key: 'reportFooter', value: 'This is a computer generated report.' },
        { key: 'billPrefix', value: 'BILL-' },
        { key: 'reportPrefix', value: 'REP-' }
      ];
      await Setting.insertMany(defaultSettings);
      console.log('Seeded default settings');
    }
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
}

async function startServer() {
  await connectDB();
  
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cors());

  // Auth Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  const isAdmin = (req: any, res: any, next: any) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    next();
  };

  // Auth Routes
  app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user || !bcrypt.compareSync(password, user.password || '')) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id, username: user.username, role: user.role }, JWT_SECRET);
    res.json({ token, user: { id: user._id, username: user.username, role: user.role, name: user.name } });
  });

  // Patient Routes
  app.get('/api/patients', authenticateToken, async (req, res) => {
    const patients = await Patient.find().sort({ createdAt: -1 });
    res.json(patients.map(p => ({ ...p.toObject(), id: p._id })));
  });

  app.post('/api/patients', authenticateToken, async (req, res) => {
    const { name, age, gender, mobile, address, referredDoctor } = req.body;
    const patientId = `P-${Date.now().toString().slice(-6)}`;
    
    const patient = await Patient.create({
      patientId, name, age, gender, mobile, address, referredDoctor
    });

    res.json({ ...patient.toObject(), id: patient._id });
  });

  app.delete('/api/patients/:id', authenticateToken, isAdmin, async (req, res) => {
    await Patient.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  });

  app.put('/api/patients/:id', authenticateToken, async (req, res) => {
    const { name, age, gender, mobile, address, referredDoctor } = req.body;
    await Patient.findByIdAndUpdate(req.params.id, { 
      name, age, gender, mobile, address, referredDoctor 
    });
    res.json({ success: true });
  });

  // Test Routes
  app.get('/api/tests', authenticateToken, async (req, res) => {
    const tests = await Test.find();
    res.json(tests.map(t => ({ ...t.toObject(), id: t._id })));
  });

  app.post('/api/tests', authenticateToken, isAdmin, async (req, res) => {
    const { name, code, category, price, normalRange, unit } = req.body;
    const test = await Test.create({ name, code, category, price, normalRange, unit });
    res.json({ ...test.toObject(), id: test._id });
  });

  app.delete('/api/tests/:id', authenticateToken, isAdmin, async (req, res) => {
    await Test.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  });

  app.put('/api/tests/:id', authenticateToken, isAdmin, async (req, res) => {
    const { name, code, category, price, normalRange, unit } = req.body;
    await Test.findByIdAndUpdate(req.params.id, { 
      name, code, category, price, normalRange, unit 
    });
    res.json({ success: true });
  });

  // Booking Routes
  app.post('/api/bookings', authenticateToken, async (req, res) => {
    const { patientId, testIds, discount, paid, paymentMode } = req.body;
    const billNumber = `BILL-${Date.now().toString().slice(-6)}`;

    const selectedTests = await Test.find({ _id: { $in: testIds } });
    const total = selectedTests.reduce((sum, t) => sum + t.price, 0);
    const finalTotal = total - (discount || 0);
    const due = finalTotal - (paid || 0);
    const status = due <= 0 ? 'completed' : 'pending';

    const booking = await Booking.create({
      billNumber,
      patient: patientId,
      tests: testIds,
      total,
      discount,
      finalTotal,
      paid,
      due,
      paymentMode,
      status
    });

    // Create results placeholders
    const resultPromises = testIds.map((testId: string) => 
      Result.create({ booking: booking._id, test: testId, status: 'pending' })
    );
    await Promise.all(resultPromises);

    res.json({ id: booking._id, billNumber, finalTotal, due, status });
  });

  app.get('/api/bookings', authenticateToken, async (req, res) => {
    const bookings = await Booking.find()
      .populate('patient', 'name')
      .sort({ createdAt: -1 });
    
    res.json(bookings.map(b => ({
      ...b.toObject(),
      id: b._id,
      patientName: (b.patient as any)?.name || 'Unknown'
    })));
  });

  app.delete('/api/bookings/:id', authenticateToken, isAdmin, async (req, res) => {
    await Booking.findByIdAndDelete(req.params.id);
    await Result.deleteMany({ booking: req.params.id });
    res.json({ success: true });
  });

  app.put('/api/bookings/:id', authenticateToken, async (req, res) => {
    const { paid, paymentMode, discount, patientId, testIds } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const updatedPaid = paid ?? booking.paid;
    const updatedDiscount = discount ?? booking.discount;
    const updateData: any = { 
      paid: updatedPaid, 
      discount: updatedDiscount,
      paymentMode: paymentMode || booking.paymentMode
    };

    if (patientId) updateData.patient = patientId;
    
    if (testIds) {
      updateData.tests = testIds;
      const selectedTests = await Test.find({ _id: { $in: testIds } });
      const total = selectedTests.reduce((sum, t) => sum + t.price, 0);
      updateData.total = total;
      updateData.finalTotal = total - updatedDiscount;
      updateData.due = updateData.finalTotal - updatedPaid;
      updateData.status = updateData.due <= 0 ? 'completed' : 'pending';

      // Sync results: Remove results for tests no longer in the list
      await Result.deleteMany({ booking: booking._id, test: { $nin: testIds } });
      
      // Add results for new tests
      const existingResults = await Result.find({ booking: booking._id });
      const existingTestIds = existingResults.map(r => r.test.toString());
      const newTestIds = testIds.filter((id: string) => !existingTestIds.includes(id));
      
      const resultPromises = newTestIds.map((testId: string) => 
        Result.create({ booking: booking._id, test: testId, status: 'pending' })
      );
      await Promise.all(resultPromises);
    } else {
      updateData.finalTotal = booking.total - updatedDiscount;
      updateData.due = updateData.finalTotal - updatedPaid;
      updateData.status = updateData.due <= 0 ? 'completed' : 'pending';
    }

    await Booking.findByIdAndUpdate(req.params.id, updateData);
    res.json({ success: true });
  });

  // Result Entry
  app.get('/api/results/:bookingId', authenticateToken, async (req, res) => {
    const results = await Result.find({ booking: req.params.bookingId })
      .populate('test', 'name unit normalRange');
    
    res.json(results.map(r => ({
      ...r.toObject(),
      id: r._id,
      testName: (r.test as any)?.name,
      unit: (r.test as any)?.unit,
      normalRange: (r.test as any)?.normalRange
    })));
  });

  app.put('/api/results/:id', authenticateToken, async (req, res) => {
    const { result, remarks } = req.body;
    await Result.findByIdAndUpdate(req.params.id, { 
      result, 
      remarks, 
      status: 'entered',
      updatedAt: new Date()
    });
    res.json({ success: true });
  });

  app.put('/api/results/:id/approve', authenticateToken, isAdmin, async (req, res) => {
    await Result.findByIdAndUpdate(req.params.id, { status: 'approved' });
    res.json({ success: true });
  });

  // Settings
  app.get('/api/settings', async (req, res) => {
    const rows = await Setting.find();
    const settings: any = {};
    rows.forEach(row => settings[row.key] = row.value);
    res.json(settings);
  });

  app.post('/api/settings', authenticateToken, isAdmin, async (req, res) => {
    const settings = req.body;
    const promises = Object.entries(settings).map(([key, value]) => 
      Setting.findOneAndUpdate({ key }, { value }, { upsert: true })
    );
    await Promise.all(promises);
    res.json({ success: true });
  });

  // Staff Management
  app.get('/api/staff', authenticateToken, isAdmin, async (req, res) => {
    const staff = await User.find({ role: 'staff' }, 'username name role');
    res.json(staff.map(s => ({ ...s.toObject(), id: s._id })));
  });

  app.post('/api/staff', authenticateToken, isAdmin, async (req, res) => {
    const { username, password, name } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username, password: hashedPassword, role: 'staff', name
    });
    res.json({ id: user._id, username: user.username, role: 'staff', name: user.name });
  });

  app.delete('/api/staff/:id', authenticateToken, isAdmin, async (req, res) => {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  });

  app.put('/api/staff/:id', authenticateToken, isAdmin, async (req, res) => {
    const { name, username, password } = req.body;
    const updateData: any = { name, username };
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    await User.findByIdAndUpdate(req.params.id, updateData);
    res.json({ success: true });
  });

  // Vite middleware for development
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
