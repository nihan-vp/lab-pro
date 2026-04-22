import React, { useEffect, useState } from 'react';
import { Plus, Search, Trash2, ReceiptText, Edit2 } from 'lucide-react';
import { api } from '../services/api';
import { Button, Input, Card, Modal, ConfirmationModal } from '../components/UI';
import { Patient, Test } from '../types';
import { useAuth } from '../hooks/useAuth';

export default function Bookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<string | null>(null);
  const [editingBooking, setEditingBooking] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    patientId: '',
    testIds: [] as string[]
  });

  const fetchData = async () => {
    try {
      const [bookingsData, patientsData, testsData] = await Promise.all([
        api.get('/api/bookings'),
        api.get('/api/patients'),
        api.get('/api/tests')
      ]);
      setBookings(bookingsData);
      setPatients(patientsData);
      setTests(testsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tests.length === 0) {
      alert('Your clinical test directory is currently empty. Please ask a Super Admin to synchronize tests for this laboratory, or import them in Settings.');
      return;
    }
    if (!formData.patientId || formData.testIds.length === 0) {
      alert('Please select a patient and at least one test');
      return;
    }
    try {
      if (editingBooking) {
        await api.put(`/api/bookings/${editingBooking.id}`, formData);
      } else {
        await api.post('/api/bookings', { 
          ...formData, 
          discount: 0,
          paid: 0,
          paymentMode: 'cash'
        });
      }
      setIsModalOpen(false);
      setEditingBooking(null);
      setFormData({ patientId: '', testIds: [] });
      fetchData();
    } catch (err) {
      alert(`Failed to ${editingBooking ? 'update' : 'create'} booking`);
    }
  };

  const handleEdit = (booking: any) => {
    setEditingBooking(booking);
    setFormData({
      patientId: booking.patient?._id || booking.patient,
      testIds: booking.tests || []
    });
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!bookingToDelete) return;
    try {
      await api.delete(`/api/bookings/${bookingToDelete}`);
      setIsConfirmOpen(false);
      setBookingToDelete(null);
      fetchData();
    } catch (err) {
      alert('Failed to delete/void booking');
    }
  };

  const calculateSubtotal = () => {
    return formData.testIds.reduce((sum, id) => {
      const test = tests.find(t => t.id === id);
      return sum + (test?.price || 0);
    }, 0);
  };

  const filteredBookings = bookings.filter(b => 
    (b.billNumber || '').toLowerCase().includes(search.toLowerCase()) || 
    (b.patientName || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Bookings & Billing</h1>
          <p className="text-zinc-500">Create tests appointments and manage payments.</p>
        </div>
        <Button onClick={() => {
          setEditingBooking(null);
          setFormData({ patientId: '', testIds: [] });
          setIsModalOpen(true);
        }} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Booking
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input 
            className="pl-10" 
            placeholder="Search by bill number or patient name..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-zinc-50 border-bottom border-zinc-100 italic">
            <tr>
              <th className="px-6 py-3 font-semibold text-zinc-600">Bill No.</th>
              <th className="px-6 py-3 font-semibold text-zinc-600">Patient</th>
              <th className="px-6 py-3 font-semibold text-zinc-600 text-right">Total Amount</th>
              <th className="px-6 py-3 font-semibold text-zinc-600">Date</th>
              <th className="px-6 py-3 font-semibold text-zinc-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-zinc-500">Loading bookings...</td></tr>
            ) : filteredBookings.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-zinc-500">No bookings found.</td></tr>
            ) : filteredBookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-zinc-50 group">
                <td className="px-6 py-4 font-mono font-medium text-zinc-900">{booking.billNumber}</td>
                <td className="px-6 py-4 font-medium text-zinc-900">{booking.patientName}</td>
                <td className="px-6 py-4 text-zinc-900 font-bold text-right">${booking.finalTotal}</td>
                <td className="px-6 py-4 text-xs text-zinc-400">
                  {new Date(booking.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleEdit(booking)}
                      className="text-zinc-400 hover:text-zinc-900 transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    {user?.role === 'admin' && (
                      <button 
                        onClick={() => {
                          setBookingToDelete(booking.id);
                          setIsConfirmOpen(true);
                        }}
                        className="text-zinc-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => {
        setIsModalOpen(false);
        setEditingBooking(null);
      }} title={editingBooking ? "Edit Booking Details" : "New Lab Request / Booking"}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Select Patient</label>
              <select 
                className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm"
                value={formData.patientId}
                onChange={e => setFormData({...formData, patientId: e.target.value})}
                required
              >
                <option value="">Select a patient...</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.patientId})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Select Tests</label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-zinc-100 p-2 rounded-md">
                {tests.map(test => (
                  <label key={test.id} className="flex items-center gap-2 p-1 text-xs hover:bg-zinc-50 rounded cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="rounded border-zinc-300"
                      checked={formData.testIds.includes(test.id)}
                      onChange={e => {
                        const newIds = e.target.checked 
                          ? [...formData.testIds, test.id] 
                          : formData.testIds.filter(id => id !== test.id);
                        setFormData({...formData, testIds: newIds});
                      }}
                    />
                    <span className="flex-1 truncate">{test.test_particulars}</span>
                    <span className="text-zinc-400">${test.price}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-500">Estimated Total</span>
              <span className="font-bold text-lg text-zinc-900">${calculateSubtotal()}</span>
            </div>
          </div>

          <Button type="submit" className="w-full h-12 flex gap-2">
            <ReceiptText className="h-4 w-4" />
            {editingBooking ? "Update Booking Data" : "Finalize Booking"}
          </Button>
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Void Booking"
        message="Are you sure you want to void this booking? This will delete the bill and all associated placeholder results. This action cannot be undone."
      />
    </div>
  );
}
