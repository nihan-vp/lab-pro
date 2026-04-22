import express from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models.js';
import { authenticateToken, withLab, isAdmin } from '../middleware.js';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v2 as cloudinary } from 'cloudinary';

const router = express.Router();

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'lab_reports',
    resource_type: 'auto',
    allowed_formats: ['pdf', 'jpg', 'png']
  } as any,
});

const upload = multer({ storage: storage });

// Patient Routes
router.get('/patients', authenticateToken, withLab, async (req: any, res) => {
  const { Patient } = req.models;
  const patients = await Patient.find().sort({ createdAt: -1 });
  res.json(patients.map((p: any) => ({ ...p.toObject(), id: p._id })));
});

router.post('/patients', authenticateToken, withLab, async (req: any, res) => {
  const { Patient } = req.models;
  const { name, age, gender, mobile, address, referredDoctor } = req.body;
  const patientId = `P-${Date.now().toString().slice(-6)}`;
  
  const patient = await Patient.create({
    patientId, name, age, gender, mobile, address, referredDoctor
  });

  res.json({ ...patient.toObject(), id: patient._id });
});

router.delete('/patients/:id', authenticateToken, isAdmin, withLab, async (req: any, res) => {
  const { Patient } = req.models;
  await Patient.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

router.put('/patients/:id', authenticateToken, withLab, async (req: any, res) => {
  const { Patient } = req.models;
  const { name, age, gender, mobile, address, referredDoctor } = req.body;
  await Patient.findByIdAndUpdate(req.params.id, { 
    name, age, gender, mobile, address, referredDoctor 
  });
  res.json({ success: true });
});

// Category Routes
router.get('/categories', authenticateToken, withLab, async (req: any, res) => {
  const { Category } = req.models;
  const categories = await Category.find().sort({ name: 1 });
  res.json(categories.map((c: any) => ({ ...c.toObject(), id: c._id })));
});

router.post('/categories', authenticateToken, isAdmin, withLab, async (req: any, res) => {
  const { Category } = req.models;
  const { name, description } = req.body;
  const category = await Category.create({ name, description });
  res.json({ ...category.toObject(), id: category._id });
});

router.put('/categories/:id', authenticateToken, isAdmin, withLab, async (req: any, res) => {
  const { Category } = req.models;
  const { name, description } = req.body;
  await Category.findByIdAndUpdate(req.params.id, { name, description });
  res.json({ success: true });
});

router.delete('/categories/:id', authenticateToken, isAdmin, withLab, async (req: any, res) => {
  const { Category, Test } = req.models;
  
  // Instead of blocking, we'll re-assign tests to "Uncategorized" (null)
  await Test.updateMany({ categoryId: req.params.id }, { categoryId: null });
  
  await Category.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// Test Routes
router.get('/tests', authenticateToken, withLab, async (req: any, res) => {
  const { Test } = req.models;
  const tests = await Test.find().populate('categoryId');
  res.json(tests.map((t: any) => ({ 
    ...t.toObject(), 
    id: t._id,
    categoryName: (t.categoryId as any)?.name || t.part_heading || 'Uncategorized' 
  })));
});

router.post('/tests/bulk-import', authenticateToken, isAdmin, withLab, async (req: any, res) => {
  const { Test, Category } = req.models;
  const tests = req.body;
  if (!Array.isArray(tests)) {
    return res.status(400).json({ error: 'Invalid data format' });
  }

  try {
    // Cache categories to avoid frequent lookups
    const categoriesList = await Category.find();
    const categoriesMap = new Map(categoriesList.map((c: any) => [c.name.toLowerCase(), c._id]));

    const results = await Promise.all(tests.map(async (t) => {
      try {
        let categoryId = t.categoryId;
        
        // If category name provided instead of ID, try to find it
        if (!categoryId && t.category) {
          categoryId = categoriesMap.get(t.category.toLowerCase());
          if (!categoryId) {
            const newCat = await Category.create({ name: t.category });
            categoryId = newCat._id;
            categoriesMap.set(t.category.toLowerCase(), categoryId);
          }
        }

        return await Test.create({
          test_particulars: t.test_particulars,
          lab_test_id: t.lab_test_id,
          part_heading: t.part_heading,
          categoryId,
          price: parseFloat(t.price || '0'),
          units: t.units,
          status: t.status,
          is_check: t.is_check
        });
      } catch (e) {
        console.error(`Failed to import test ${t.test_particulars}`, e);
        return null;
      }
    }));
    
    const importedCount = results.filter(r => r !== null).length;
    res.json({ success: true, count: importedCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Bulk import failed' });
  }
});

router.post('/tests', authenticateToken, isAdmin, withLab, async (req: any, res) => {
  const { Test } = req.models;
  const { test_particulars, lab_test_id, part_heading, categoryId, price, units, status, is_check } = req.body;
  const test = await Test.create({ test_particulars, lab_test_id, part_heading, categoryId, price, units, status, is_check });
  res.json({ ...test.toObject(), id: test._id });
});

router.delete('/tests/:id', authenticateToken, isAdmin, withLab, async (req: any, res) => {
  const { Test } = req.models;
  await Test.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

router.put('/tests/:id', authenticateToken, isAdmin, withLab, async (req: any, res) => {
  const { Test } = req.models;
  const { test_particulars, lab_test_id, part_heading, categoryId, price, units, status, is_check } = req.body;
  await Test.findByIdAndUpdate(req.params.id, { 
    test_particulars, lab_test_id, part_heading, categoryId, price, units, status, is_check 
  });
  res.json({ success: true });
});

// Booking Routes
router.post('/bookings', authenticateToken, withLab, async (req: any, res) => {
  const { Test, Booking, Result } = req.models;
  const { patientId, testIds, discount, paid, paymentMode } = req.body;
  const billNumber = `BILL-${Date.now().toString().slice(-6)}`;

  const selectedTests = await Test.find({ _id: { $in: testIds } });
  const total = selectedTests.reduce((sum: number, t: any) => sum + t.price, 0);
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

  const resultPromises = testIds.map((testId: string) => 
    Result.create({ booking: booking._id, test: testId, status: 'pending' })
  );
  await Promise.all(resultPromises);

  res.json({ id: booking._id, billNumber, finalTotal, due, status });
});

router.get('/bookings', authenticateToken, withLab, async (req: any, res) => {
  const { Booking } = req.models;
  const bookings = await Booking.find()
    .populate('patient', 'name')
    .sort({ createdAt: -1 });
  
  res.json(bookings.map((b: any) => ({
    ...b.toObject(),
    id: b._id,
    patientName: (b.patient as any)?.name || 'Unknown'
  })));
});

router.delete('/bookings/:id', authenticateToken, isAdmin, withLab, async (req: any, res) => {
  const { Booking, Result } = req.models;
  await Booking.findByIdAndDelete(req.params.id);
  await Result.deleteMany({ booking: req.params.id });
  res.json({ success: true });
});

router.put('/bookings/:id', authenticateToken, withLab, async (req: any, res) => {
  const { Booking, Test, Result } = req.models;
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
    const total = selectedTests.reduce((sum: number, t: any) => sum + t.price, 0);
    updateData.total = total;
    updateData.finalTotal = total - updatedDiscount;
    updateData.due = updateData.finalTotal - updatedPaid;
    updateData.status = updateData.due <= 0 ? 'completed' : 'pending';

    await Result.deleteMany({ booking: booking._id, test: { $nin: testIds } });
    
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
router.get('/results/:bookingId', authenticateToken, withLab, async (req: any, res) => {
  const { Result } = req.models;
  const results = await Result.find({ booking: req.params.bookingId })
    .populate('test', 'test_particulars units');
  
  res.json(results.map((r: any) => ({
    ...r.toObject(),
    id: r._id,
    testName: (r.test as any)?.test_particulars,
    unit: (r.test as any)?.units,
    pdfUrls: r.pdfUrls || []
  })));
});

router.post('/upload', authenticateToken, (req, res, next) => {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return res.status(500).json({ error: 'Cloudinary is not configured.' });
  }
  next();
}, upload.array('reports'), (req: any, res) => {
  if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No files uploaded' });
  const urls = req.files.map((f: any) => f.path);
  res.json({ urls });
});

router.put('/results/:id', authenticateToken, withLab, async (req: any, res) => {
  const { Result } = req.models;
  const { result, remarks, pdfUrls } = req.body;
  const existingResult = await Result.findById(req.params.id);
  if (!existingResult) return res.status(404).json({ error: 'Result not found' });

  if (existingResult.status !== 'pending' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only administrators can edit laboratory findings once submitted.' });
  }

  const updateData: any = { 
    result, 
    remarks, 
    pdfUrls,
    updatedAt: new Date()
  };

  if (existingResult.status === 'pending') {
    updateData.status = 'entered';
  }

  await Result.findByIdAndUpdate(req.params.id, updateData);
  res.json({ success: true });
});

router.put('/results/:id/approve', authenticateToken, withLab, async (req: any, res) => {
  const { Result } = req.models;
  await Result.findByIdAndUpdate(req.params.id, { status: 'approved' });
  res.json({ success: true });
});

// Settings
router.get('/settings', authenticateToken, withLab, async (req: any, res) => {
  const { Setting } = req.models;
  const rows = await Setting.find();
  const settings: any = {};
  rows.forEach((row: any) => settings[row.key] = row.value);
  res.json(settings);
});

router.post('/settings', authenticateToken, isAdmin, withLab, async (req: any, res) => {
  const { Setting } = req.models;
  const settings = req.body;
  const promises = Object.entries(settings).map(([key, value]) => 
    Setting.findOneAndUpdate({ key }, { value }, { upsert: true })
  );
  await Promise.all(promises);
  res.json({ success: true });
});

// Staff Management
router.get('/staff', authenticateToken, isAdmin, withLab, async (req: any, res) => {
  const staff = await User.find({ role: 'staff', labId: req.user.labId }, 'username name role');
  res.json(staff.map((s: any) => ({ ...s.toObject(), id: s._id })));
});

router.post('/staff', authenticateToken, isAdmin, withLab, async (req: any, res) => {
  const { username, password, name } = req.body;
  const existing = await User.findOne({ username });
  if (existing) return res.status(400).json({ error: 'Username already exists' });

  const hashedPassword = await bcrypt.hash(password, 10);
  const userSnapshot = await User.create({
    username, 
    password: hashedPassword, 
    role: 'staff', 
    name,
    labId: req.user.labId
  });
  res.json({ id: userSnapshot._id, username: userSnapshot.username, role: 'staff', name: userSnapshot.name });
});

router.delete('/staff/:id', authenticateToken, isAdmin, async (req: any, res) => {
  const query: any = { _id: req.params.id, role: 'staff' };
  if (req.user.role !== 'superadmin') {
    query.labId = req.user.labId;
  }
  
  const result = await User.findOneAndDelete(query);
  if (!result) return res.status(404).json({ error: 'Staff member not found or access denied' });
  res.json({ success: true });
});

router.put('/staff/:id', authenticateToken, isAdmin, async (req: any, res) => {
  const { name, username, password } = req.body;
  const query: any = { _id: req.params.id, role: 'staff' };
  if (req.user.role !== 'superadmin') {
    query.labId = req.user.labId;
  }

  const targetUser = await User.findOne(query);
  if (!targetUser) return res.status(404).json({ error: 'Staff member not found' });

  const updateData: any = { name, username };
  if (password) {
    updateData.password = await bcrypt.hash(password, 10);
  }
  await User.findByIdAndUpdate(req.params.id, updateData);
  res.json({ success: true });
});

// Dashboard
router.get('/dashboard/pending-approvals', authenticateToken, withLab, async (req: any, res) => {
  const { Result } = req.models;
  const pendingResults = await Result.find({ status: 'entered' })
    .populate('test', 'test_particulars')
    .populate({
      path: 'booking',
      populate: { path: 'patient', select: 'name' }
    })
    .sort({ updatedAt: -1 })
    .limit(10);
    
  res.json(pendingResults.map((r: any) => ({
    id: r._id,
    testName: (r.test as any)?.test_particulars,
    patientName: (r.booking as any)?.patient?.name,
    billNumber: (r.booking as any)?.billNumber,
    date: r.updatedAt
  })));
});

router.get('/dashboard/recent-activities', authenticateToken, withLab, async (req: any, res) => {
  const { Patient, Booking, Result } = req.models;
  const [recentPatients, recentBookings, recentResults] = await Promise.all([
    Patient.find().sort({ createdAt: -1 }).limit(5),
    Booking.find().populate('patient', 'name').sort({ createdAt: -1 }).limit(5),
    Result.find({ status: { $ne: 'pending' } }).populate('test', 'test_particulars').sort({ updatedAt: -1 }).limit(5)
  ]);

  const activities: any[] = [];

  recentPatients.forEach(p => {
    activities.push({
      type: 'patient',
      message: `New patient registered: ${p.name}`,
      date: p.createdAt,
      id: p._id
    });
  });

  recentBookings.forEach(b => {
    activities.push({
      type: 'booking',
      message: `New booking created for ${(b.patient as any)?.name || 'Unknown'} - Bill: ${b.billNumber}`,
      date: b.createdAt,
      id: b._id
    });
  });

  recentResults.forEach(r => {
    activities.push({
      type: 'result',
      message: `Result ${r.status} for ${(r.test as any)?.test_particulars || 'Unknown'}`,
      date: r.updatedAt,
      id: r._id
    });
  });

  activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  res.json(activities.slice(0, 10));
});

export default router;
