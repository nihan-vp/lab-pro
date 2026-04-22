import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['superadmin', 'admin', 'staff'], default: 'staff' },
  name: { type: String, required: true },
  labId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lab' }
});

const LabSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dbUri: { type: String }, // Optional: separate DB for this lab
  status: { type: String, enum: ['active', 'suspended'], default: 'active' },
  createdAt: { type: Date, default: Date.now }
});

const PatientSchema = new mongoose.Schema({
  patientId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  mobile: { type: String, required: true },
  address: { type: String },
  referredDoctor: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const TestSchema = new mongoose.Schema({
  test_particulars: { type: String, required: true },
  lab_test_id: { type: String, required: true, unique: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  part_heading: { type: String }, // Keep for backward compatibility or as a sub-heading
  price: { type: Number, required: true, default: 0 },
  units: { type: String },
  status: { type: String, default: 'active' },
  is_check: { type: String, default: '0' },
  created_at: { type: Date, default: Date.now }
});

const BookingSchema = new mongoose.Schema({
  billNumber: { type: String, required: true, unique: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  tests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Test' }],
  total: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  finalTotal: { type: Number, required: true },
  paid: { type: Number, default: 0 },
  due: { type: Number, required: true },
  paymentMode: { type: String, enum: ['cash', 'online'], default: 'cash' },
  status: { type: String, enum: ['pending', 'completed', 'cancelled'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

const ResultSchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  test: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
  result: { type: String },
  remarks: { type: String },
  pdfUrls: [{ type: String }],
  status: { type: String, enum: ['pending', 'entered', 'approved'], default: 'pending' },
  updatedAt: { type: Date, default: Date.now }
});

const SettingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true }
});

export const User = mongoose.model('User', UserSchema);
export const Lab = mongoose.model('Lab', LabSchema);
export const Patient = mongoose.model('Patient', PatientSchema);
export const Category = mongoose.model('Category', CategorySchema);
export const Test = mongoose.model('Test', TestSchema);
export const Booking = mongoose.model('Booking', BookingSchema);
export const Result = mongoose.model('Result', ResultSchema);
export const Setting = mongoose.model('Setting', SettingSchema);

export { UserSchema, LabSchema, PatientSchema, CategorySchema, TestSchema, BookingSchema, ResultSchema, SettingSchema };
