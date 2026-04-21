import React, { useEffect, useState } from 'react';
import { FlaskConical, ChevronRight, CheckCircle2, User, Search } from 'lucide-react';
import { api } from '../services/api';
import { Button, Input, Card, Modal, Badge, ConfirmationModal } from '../components/UI';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../utils/cn';

export default function ResultEntry() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [resultToApprove, setResultToApprove] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchBookings = async () => {
    try {
      const data = await api.get('/api/bookings');
      setBookings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleSelectBooking = async (booking: any) => {
    setSelectedBooking(booking);
    try {
      const data = await api.get(`/api/results/${booking.id}`);
      setResults(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateResult = async (id: string, result: string, remarks: string) => {
    try {
      await api.put(`/api/results/${id}`, { result, remarks });
      const updatedResults = results.map(r => r.id === id ? { ...r, result, remarks, status: 'entered' } : r);
      setResults(updatedResults);
    } catch (err) {
      alert('Failed to update result');
    }
  };

  const handleApprove = async () => {
    if (!resultToApprove) return;
    try {
      await api.put(`/api/results/${resultToApprove}/approve`, {});
      const updatedResults = results.map(r => r.id === resultToApprove ? { ...r, status: 'approved' } : r);
      setResults(updatedResults);
      setIsConfirmOpen(false);
      setResultToApprove(null);
    } catch (err) {
      alert('Failed to approve result');
    }
  };

  const filteredBookings = bookings.filter(b => 
    b.billNumber.toLowerCase().includes(search.toLowerCase()) || 
    b.patientName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Selection Column */}
      <div className="space-y-6 lg:col-span-1">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Result Entry</h1>
          <p className="text-zinc-500">Select a booking to enter test findings.</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input 
            className="pl-10" 
            placeholder="Search bill or patient..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-250px)] pr-1">
          {loading ? (
            <div className="text-center py-4 text-zinc-500">Loading...</div>
          ) : filteredBookings.map((booking) => (
            <button
              key={booking.id}
              onClick={() => handleSelectBooking(booking)}
              className={cn(
                "w-full text-left p-4 rounded-xl border transition-all hover:shadow-md",
                selectedBooking?.id === booking.id 
                  ? "border-zinc-900 bg-zinc-900 text-white" 
                  : "border-zinc-200 bg-white text-zinc-900"
              )}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-mono text-xs opacity-70 uppercase">{booking.billNumber}</span>
                <ChevronRight className="h-4 w-4 opacity-50" />
              </div>
              <p className="font-bold truncate">{booking.patientName}</p>
              <p className={cn("text-xs mt-1", selectedBooking?.id === booking.id ? "text-zinc-400" : "text-zinc-500")}>
                {new Date(booking.createdAt).toLocaleDateString()}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Entry Column */}
      <div className="lg:col-span-2 space-y-6">
        {selectedBooking ? (
          <>
            <Card className="p-6 bg-zinc-900 text-white border-none">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800">
                  <User className="h-6 w-6 text-zinc-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{selectedBooking.patientName}</h2>
                  <p className="text-zinc-400 text-sm">Bill No: {selectedBooking.billNumber}</p>
                </div>
              </div>
            </Card>

            <div className="space-y-4">
              {results.map((item) => (
                <Card key={item.id} className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-zinc-900">{item.testName}</h3>
                      <p className="text-xs text-zinc-500 italic mt-0.5">Normal Range: {item.normalRange} {item.unit}</p>
                    </div>
                    <Badge variant={item.status === 'approved' ? 'success' : item.status === 'entered' ? 'warning' : 'neutral'}>
                      {item.status.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Test Finding</label>
                      <div className="relative">
                        <Input 
                          placeholder="Enter value"
                          value={item.result || ''} 
                          disabled={item.status === 'approved'}
                          onChange={e => {
                            const val = e.target.value;
                            setResults(results.map(r => r.id === item.id ? { ...r, result: val } : r));
                          }}
                          onBlur={() => handleUpdateResult(item.id, item.result, item.remarks)}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 italic font-medium">{item.unit}</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Remarks</label>
                      <Input 
                        placeholder="Clinical remarks..."
                        value={item.remarks || ''}
                        disabled={item.status === 'approved'}
                        onChange={e => {
                          const val = e.target.value;
                          setResults(results.map(r => r.id === item.id ? { ...r, remarks: val } : r));
                        }}
                        onBlur={() => handleUpdateResult(item.id, item.result, item.remarks)}
                      />
                    </div>
                  </div>

                  {user?.role === 'admin' && item.status === 'entered' && (
                    <div className="mt-6 flex justify-end">
                      <Button 
                        variant="primary" 
                        onClick={() => {
                          setResultToApprove(item.id);
                          setIsConfirmOpen(true);
                        }} 
                        className="gap-2"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Approve Result
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center p-12 border-2 border-dashed border-zinc-200 rounded-2xl bg-zinc-50">
            <FlaskConical className="h-12 w-12 text-zinc-300 mb-4" />
            <h3 className="text-lg font-bold text-zinc-400">No Booking Selected</h3>
            <p className="text-zinc-500 max-w-xs mt-1">Select a patient from the left column to record and approve test results.</p>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleApprove}
        variant="primary"
        title="Approve Test Result"
        message="Are you sure you want to approve this test result? Once approved, the finding cannot be edited by staff."
        confirmText="Approve Result"
      />
    </div>
  );
}

// End of file
