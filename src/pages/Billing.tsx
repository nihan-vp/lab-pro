import React, { useEffect, useState } from 'react';
import { CreditCard, DollarSign, Wallet, Search, ArrowUpRight, ArrowDownRight, Plus, Printer, Edit3, ReceiptText, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { Card, Input, Badge, Button, Modal, ConfirmationModal } from '../components/UI';
import { cn } from '../utils/cn';
import { Patient, Test } from '../types';
import { useAuth } from '../hooks/useAuth';

export default function Billing() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'paid' | 'unpaid' | 'partial'>('all');
  
  // Modals
  const [isNewBillModalOpen, setIsNewBillModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [bookingToDelete, setBookingToDelete] = useState<string | null>(null);

  const { user } = useAuth();

  const [formData, setFormData] = useState({
    patientId: '',
    testIds: [] as string[],
    discount: '0',
    paid: '0',
    paymentMode: 'cash'
  });

  const [paymentData, setPaymentData] = useState({
    paid: '0',
    discount: '0',
    paymentMode: 'cash'
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

  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientId || formData.testIds.length === 0) {
      alert('Please select a patient and at least one test');
      return;
    }
    try {
      await api.post('/api/bookings', { 
        ...formData, 
        discount: parseFloat(formData.discount),
        paid: parseFloat(formData.paid)
      });
      setIsNewBillModalOpen(false);
      setFormData({ patientId: '', testIds: [], discount: '0', paid: '0', paymentMode: 'cash' });
      fetchData();
    } catch (err) {
      alert('Failed to create bill');
    }
  };

  const handleUpdatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/api/bookings/${selectedBooking.id}`, { 
        ...paymentData,
        paid: parseFloat(paymentData.paid),
        discount: parseFloat(paymentData.discount)
      });
      setIsPaymentModalOpen(false);
      setSelectedBooking(null);
      fetchData();
    } catch (err) {
      alert('Failed to update payment');
    }
  };

  const handleDelete = async () => {
    if (!bookingToDelete) return;
    try {
      await api.delete(`/api/bookings/${bookingToDelete}`);
      setIsConfirmOpen(false);
      setBookingToDelete(null);
      fetchData();
    } catch (err) {
      alert('Failed to void booking');
    }
  };

  const calculateSubtotal = () => {
    return formData.testIds.reduce((sum, id) => {
      const test = tests.find(t => t.id === id);
      return sum + (test?.price || 0);
    }, 0);
  };

  const stats = {
    totalRevenue: bookings.reduce((sum, b) => sum + b.finalTotal, 0),
    totalCollected: bookings.reduce((sum, b) => sum + b.paid, 0),
    totalDue: bookings.reduce((sum, b) => sum + b.due, 0),
    cashCollection: bookings.filter(b => b.paymentMode === 'cash').reduce((sum, b) => sum + b.paid, 0),
    onlineCollection: bookings.filter(b => b.paymentMode === 'online').reduce((sum, b) => sum + b.paid, 0),
  };

  const filteredBookings = bookings.filter(b => {
    const matchesSearch = b.billNumber.toLowerCase().includes(search.toLowerCase()) || 
                         b.patientName.toLowerCase().includes(search.toLowerCase());
    
    if (filter === 'paid') return matchesSearch && b.due === 0;
    if (filter === 'unpaid') return matchesSearch && b.paid === 0;
    if (filter === 'partial') return matchesSearch && b.due > 0 && b.paid > 0;
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Billing & Revenue</h1>
          <p className="text-zinc-500">Track collections, dues, and financial summaries.</p>
        </div>
        <Button onClick={() => setIsNewBillModalOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Bill
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Total Revenue</span>
            <div className="p-2 bg-zinc-100 rounded-lg">
              <DollarSign className="h-4 w-4 text-zinc-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-zinc-900">${stats.totalRevenue.toFixed(2)}</p>
          <div className="mt-2 flex items-center gap-1 text-[10px] font-medium text-zinc-400">
            <span className="text-emerald-600 font-bold">${stats.totalCollected.toFixed(2)} collected</span>
            <span>from {bookings.length} invoices</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Balance Due</span>
            <div className="p-2 bg-red-50 rounded-lg">
              <Wallet className="h-4 w-4 text-red-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-red-600">${stats.totalDue.toFixed(2)}</p>
          <div className="mt-2 flex items-center gap-1 text-[10px] font-medium text-zinc-400 italic">
            Outstanding payments across all modules
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Payment Mix</span>
            <div className="p-2 bg-zinc-100 rounded-lg">
              <CreditCard className="h-4 w-4 text-zinc-600" />
            </div>
          </div>
          <div className="space-y-2 mt-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-500 flex items-center gap-1"><ArrowUpRight className="h-3 w-3 text-emerald-500" /> Cash</span>
              <span className="font-bold text-zinc-900">${stats.cashCollection.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-500 flex items-center gap-1"><ArrowDownRight className="h-3 w-3 text-blue-500" /> Online</span>
              <span className="font-bold text-zinc-900">${stats.onlineCollection.toFixed(2)}</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input 
            className="pl-10" 
            placeholder="Search invoice or patient..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'paid', 'partial', 'unpaid'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-lg capitalize border transition-all",
                filter === f 
                  ? "bg-zinc-900 border-zinc-900 text-white" 
                  : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-zinc-50 border-bottom border-zinc-100 italic">
            <tr>
              <th className="px-6 py-3 font-semibold text-zinc-600 text-xs uppercase tracking-wider">Invoice</th>
              <th className="px-6 py-3 font-semibold text-zinc-600 text-xs uppercase tracking-wider">Patient</th>
              <th className="px-6 py-3 font-semibold text-zinc-600 text-xs uppercase tracking-wider text-right">Total</th>
              <th className="px-6 py-3 font-semibold text-zinc-600 text-xs uppercase tracking-wider text-right text-emerald-600">Paid</th>
              <th className="px-6 py-3 font-semibold text-zinc-600 text-xs uppercase tracking-wider text-right text-red-500">Due</th>
              <th className="px-6 py-3 font-semibold text-zinc-600 text-xs uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 font-semibold text-zinc-600 text-xs uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {loading ? (
              <tr><td colSpan={7} className="px-6 py-8 text-center text-zinc-500">Computing financials...</td></tr>
            ) : filteredBookings.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-8 text-center text-zinc-500 font-medium italic">No matching transactions found.</td></tr>
            ) : filteredBookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-zinc-50 transition-colors">
                <td className="px-6 py-4 font-mono font-medium text-zinc-900">{booking.billNumber}</td>
                <td className="px-6 py-4 text-zinc-700 font-medium">
                  {booking.patientName}
                  <div className="text-[10px] text-zinc-400">{new Date(booking.createdAt).toLocaleDateString()}</div>
                </td>
                <td className="px-6 py-4 text-right font-bold text-zinc-900">${booking.finalTotal}</td>
                <td className="px-6 py-4 text-right text-emerald-600 font-bold">${booking.paid}</td>
                <td className={cn("px-6 py-4 text-right font-bold", booking.due > 0 ? "text-red-600" : "text-zinc-300")}>
                  ${booking.due}
                </td>
                <td className="px-6 py-4">
                  <Badge className="capitalize" variant={booking.due === 0 ? 'success' : 'warning'}>
                    {booking.due === 0 ? 'Paid' : 'Unpaid'}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button 
                      title="Collect Payment"
                      onClick={() => {
                        setSelectedBooking(booking);
                        setPaymentData({
                          paid: booking.paid.toString(),
                          discount: booking.discount.toString(),
                          paymentMode: booking.paymentMode
                        });
                        setIsPaymentModalOpen(true);
                      }}
                      className="text-zinc-400 hover:text-zinc-900 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <button 
                      title="Print Invoice"
                      onClick={() => {
                        setSelectedBooking(booking);
                        setIsInvoiceModalOpen(true);
                      }}
                      className="text-zinc-400 hover:text-blue-600 transition-colors"
                    >
                      <Printer className="h-4 w-4" />
                    </button>
                    {user?.role === 'admin' && (
                      <button 
                        title="Void Bill"
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

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Void Billing Invoice"
        message="Are you sure you want to void this bill? This will delete the transaction record and all associated laboratory results. This action cannot be undone."
      />

      {/* New Bill Modal */}
      <Modal isOpen={isNewBillModalOpen} onClose={() => setIsNewBillModalOpen(false)} title="Generate New Billing Invoice">
        <form onSubmit={handleCreateBill} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Select Patient</label>
              <select 
                className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm"
                value={formData.patientId}
                onChange={e => setFormData({...formData, patientId: e.target.value})}
                required
              >
                <option value="">Search patient...</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.patientId})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Add Tests to Invoice</label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-zinc-100 p-2 rounded-md">
                {tests.map(test => (
                  <label key={test.id} className="flex items-center gap-2 p-1 text-xs hover:bg-zinc-50 rounded cursor-pointer group">
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
                    <span className="flex-1 truncate group-hover:text-zinc-900 transition-colors">{test.name}</span>
                    <span className="text-zinc-400 group-hover:text-zinc-600">${test.price}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-500">Subtotal</span>
              <span className="font-medium text-zinc-900 font-mono">${calculateSubtotal()}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-500">Discount Allocation</span>
              <div className="w-24">
                <Input 
                  className="h-7 text-right" 
                  type="number" 
                  value={formData.discount} 
                  onChange={e => setFormData({...formData, discount: e.target.value})} 
                />
              </div>
            </div>
            <div className="flex justify-between items-center text-lg font-bold border-t border-zinc-200 pt-2">
              <span className="text-zinc-900">Total Payable</span>
              <span className="text-zinc-900 font-mono">${calculateSubtotal() - parseFloat(formData.discount || '0')}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Initial Payment</label>
              <Input required type="number" value={formData.paid} onChange={e => setFormData({...formData, paid: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Payment Mode</label>
              <select 
                className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm"
                value={formData.paymentMode}
                onChange={e => setFormData({...formData, paymentMode: e.target.value as any})}
              >
                <option value="cash">Cash</option>
                <option value="online">Online</option>
              </select>
            </div>
          </div>

          <Button type="submit" className="w-full h-12 flex gap-2">
            <ReceiptText className="h-4 w-4" />
            Finalize Invoice
          </Button>
        </form>
      </Modal>

      {/* Payment Update Modal */}
      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Add Payment / Adjustment">
        <form onSubmit={handleUpdatePayment} className="space-y-4">
          <div className="p-4 bg-red-50 rounded-lg border border-red-100 flex items-center justify-between">
             <span className="text-sm font-semibold text-red-700 uppercase tracking-wider">Balance Outstanding</span>
             <span className="text-xl font-bold text-red-700">${selectedBooking?.due || 0}</span>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Apply Extra Discount</label>
            <Input type="number" value={paymentData.discount} onChange={e => setPaymentData({...paymentData, discount: e.target.value})} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Total Amount Collected (Cumulative)</label>
            <Input type="number" value={paymentData.paid} onChange={e => setPaymentData({...paymentData, paid: e.target.value})} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Payment Mode</label>
            <select 
              className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm"
              value={paymentData.paymentMode}
              onChange={e => setPaymentData({...paymentData, paymentMode: e.target.value as any})}
            >
              <option value="cash">Cash</option>
              <option value="online">Online</option>
            </select>
          </div>
          <div className="pt-4">
            <Button type="submit" className="w-full h-11">Record Payment</Button>
          </div>
        </form>
      </Modal>

      {/* Invoice View Modal */}
      <Modal isOpen={isInvoiceModalOpen} onClose={() => setIsInvoiceModalOpen(false)} title="Patient Invoice Preview">
        {selectedBooking && (
          <div className="space-y-8 p-4 bg-white" id="invoice-print-area">
            <div className="flex justify-between items-start border-b border-zinc-100 pb-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-zinc-900 uppercase tracking-tighter">BioLab Pro</h2>
                <p className="text-xs text-zinc-500 max-w-[200px]">123 Medical Plaza, Health Street, Lab City</p>
                <p className="text-xs text-zinc-500">+1 (555) 000-LABS</p>
              </div>
              <div className="text-right space-y-1">
                <h3 className="text-lg font-bold text-zinc-900">INVOICE</h3>
                <p className="text-xs font-mono text-zinc-500">{selectedBooking.billNumber}</p>
                <p className="text-xs text-zinc-400">{new Date(selectedBooking.createdAt).toLocaleString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 text-sm">
              <div className="space-y-1">
                <p className="text-xs font-bold text-zinc-400 uppercase">Patient Details</p>
                <p className="font-bold text-zinc-900">{selectedBooking.patientName}</p>
                <p className="text-zinc-500 italic">ID: {selectedBooking.patientId || "N/A"}</p>
              </div>
              <div className="text-right space-y-1">
                <p className="text-xs font-bold text-zinc-400 uppercase">Billed By</p>
                <p className="text-zinc-900 font-medium italic underline decoration-zinc-200">System Admin</p>
              </div>
            </div>

            <table className="w-full text-sm">
              <thead className="border-b border-zinc-200">
                <tr>
                  <th className="py-2 text-left font-bold text-zinc-900">Description</th>
                  <th className="py-2 text-right font-bold text-zinc-900">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {selectedBooking.tests?.map((testId: string) => {
                  const test = tests.find(t => t.id === testId);
                  return (
                    <tr key={testId}>
                      <td className="py-3 text-zinc-700">{test?.name || "Laboratory Test"}</td>
                      <td className="py-3 text-right text-zinc-900 font-mono">${test?.price || 0}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t border-zinc-200">
                <tr className="text-xs text-zinc-500">
                  <td className="py-4 text-right pr-4">Subtotal</td>
                  <td className="py-4 text-right font-mono">${selectedBooking.tests?.reduce((sum: number, id: string) => sum + (tests.find(t => t.id === id)?.price || 0), 0)}</td>
                </tr>
                <tr className="text-xs text-zinc-500">
                  <td className="pb-4 text-right pr-4">Discount</td>
                  <td className="pb-4 text-right font-mono text-red-500">-${selectedBooking.discount}</td>
                </tr>
                <tr className="text-lg font-bold text-zinc-900 border-t border-zinc-100">
                  <td className="py-4 text-right pr-4 uppercase tracking-tighter">Grand Total</td>
                  <td className="py-4 text-right font-mono">${selectedBooking.finalTotal}</td>
                </tr>
                <tr className="text-xs text-emerald-600 font-bold border-t border-zinc-100">
                  <td className="py-2 text-right pr-4">Total Paid</td>
                  <td className="py-2 text-right font-mono italic">-${selectedBooking.paid}</td>
                </tr>
                <tr className="text-sm text-red-600 font-bold bg-zinc-50">
                  <td className="py-3 text-right pr-4">Balance Outstanding</td>
                  <td className="py-3 text-right font-mono tracking-widest underline decoration-double decoration-red-200">${selectedBooking.due}</td>
                </tr>
              </tfoot>
            </table>

            <div className="pt-8 border-t border-zinc-100 text-[10px] text-center text-zinc-400 italic">
               * This is a computer generated invoice. No signature required.
            </div>

            <div className="flex gap-3 pt-6 no-print">
              <Button onClick={() => window.print()} className="flex-1 gap-2">
                <Printer className="h-4 w-4" />
                Print Now
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
