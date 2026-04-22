export type UserRole = 'admin' | 'staff';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
}

export interface Patient {
  id: string;
  patientId: string;
  name: string;
  age: number;
  gender: string;
  mobile: string;
  address: string;
  referredDoctor?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
}

export interface Test {
  id: string;
  test_particulars: string;
  lab_test_id: string;
  categoryId?: string;
  category?: Category;
  categoryName?: string;
  part_heading: string;
  price: number;
  units: string;
  status?: string;
  is_check?: string;
  created_at?: string;
}

export interface Booking {
  id: string;
  billNumber: string;
  patientId: string;
  patientName: string;
  tests: string[]; // Array of Test IDs or names? Let's say IDs.
  total: number;
  discount: number;
  finalTotal: number;
  paid: number;
  due: number;
  paymentMode: 'cash' | 'online';
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface TestResult {
  id: string;
  bookingId: string;
  testId: string;
  testName: string;
  result: string;
  unit: string;
  remarks: string;
  status: 'pending' | 'entered' | 'approved';
}

export interface LabSettings {
  labName: string;
  logo: string;
  address: string;
  phone: string;
  email: string;
  reportFooter: string;
  billPrefix: string;
  reportPrefix: string;
}
