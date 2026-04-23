import mongoose from 'mongoose';
import { User, Setting, LabSchema, PatientSchema, CategorySchema, TestSchema, BookingSchema, ResultSchema, SettingSchema, UserSchema } from './models.ts';
import bcrypt from 'bcryptjs';

export const labConnections = new Map<string, mongoose.Connection>();
export const labModels = new Map<string, any>();

// The Master URI identifies the Superadmin/Global Cluster
// We prioritize the user's provided superadmin-db URI for clinical platform coordination
export const MONGODB_URI = 'mongodb+srv://qwerty311980_db_user:8XggP8d16ZsHeffh@binformed.lfjrbxn.mongodb.net/superadmin-db';

export async function connectDB() {
  // If already connected correctly, skip
  // Use optional chaining for host to prevent crashes if it's not yet populated
  if (mongoose.connection.readyState >= 1 && mongoose.connection.host?.includes('binformed')) return;
  
  if (mongoose.connection.readyState >= 1) {
    console.log('Disconnecting from incorrect database instance...');
    await mongoose.disconnect();
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to Master MongoDB (Superadmin Cluster)');
    
    // Seed default Super Admin
    const superAdminExists = await User.findOne({ role: 'superadmin' });
    if (!superAdminExists) {
      const hashedPassword = await bcrypt.hash('M@jA5u9n', 10);
      await User.create({
        username: 'superadmin',
        password: hashedPassword,
        role: 'superadmin',
        name: 'Super Administrator'
      });
      console.log('Seeded default superadmin');
    }

    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('M@jA5u9n', 10);
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

export const masterConnectionPromise = connectDB().then(() => mongoose.connection);

export async function getLabModels(labId: string, dbUri?: string) {
  const cacheKey = `${labId}-${dbUri || 'default'}`;
  if (labModels.has(cacheKey)) return labModels.get(cacheKey);

  const masterConn = await masterConnectionPromise;
  let connection: mongoose.Connection;
  
  const isDedicated = dbUri && dbUri.trim() && dbUri.trim().startsWith('mongodb') && dbUri.trim() !== MONGODB_URI;
  
  let targetDbName: string | null = null;
  if (dbUri && dbUri.trim() && !isDedicated && dbUri.trim() !== MONGODB_URI) {
    targetDbName = dbUri.trim().replace(/^\//, '').split('.')[0]; 
  } else {
    targetDbName = (labId === 'master') ? 'superadmin_db' : `lab-${labId}`;
  }

  if (isDedicated) {
    const uri = dbUri!.trim();
    if (labConnections.has(uri)) {
      connection = labConnections.get(uri)!;
    } else {
      try {
        connection = await mongoose.createConnection(uri).asPromise();
        labConnections.set(uri, connection);
        console.log(`Connection established for dedicated lab: ${labId}`);
      } catch (err) {
        console.error(`Dedicated connection failed for lab ${labId}:`, err);
        return getLabModels(labId, undefined);
      }
    }
  } else if (targetDbName) {
    connection = masterConn.useDb(targetDbName, { useCache: true });
    console.log(`Using shared cluster DB '${targetDbName}' for lab: ${labId}`);
  } else {
    connection = masterConn;
  }

  const models = {
    Patient: connection.model('Patient', PatientSchema),
    Category: connection.model('Category', CategorySchema),
    Test: connection.model('Test', TestSchema),
    Booking: connection.model('Booking', BookingSchema),
    Result: connection.model('Result', ResultSchema),
    Setting: connection.model('Setting', SettingSchema),
    User: connection.model('User', UserSchema),
  };

  try {
    const settingsCount = await models.Setting.countDocuments();
    if (settingsCount === 0) {
      console.log(`Bootstrapping default environment for lab: ${labId}`);
      let labName = labId === 'master' ? 'Superadmin Portal' : 'New Laboratory';
      if (labId !== 'master' && /^[0-9a-fA-F]{24}$/.test(labId)) {
        const masterModels = await masterConnectionPromise;
        const labInfo = await masterModels.model('Lab', LabSchema).findById(labId);
        if (labInfo) labName = labInfo.name;
      }
      
      const defaultSettings = [
        { key: 'labName', value: labName },
        { key: 'logo', value: '' },
        { key: 'address', value: 'Default Address' },
        { key: 'phone', value: '+123456789' },
        { key: 'email', value: 'lab@example.com' },
        { key: 'reportFooter', value: 'Automated Diagnostic Report' },
        { key: 'billPrefix', value: 'BILL-' },
        { key: 'reportPrefix', value: 'REP-' }
      ];
      await models.Setting.insertMany(defaultSettings);
    }
  } catch (err) {
    console.error(`Bootstrapping failed for lab ${labId}:`, err);
  }

  labModels.set(cacheKey, models);
  return models;
}
