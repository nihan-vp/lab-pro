import React, { useEffect, useState } from 'react';
import { FileText, Printer, Search, Download } from 'lucide-react';
import { api } from '../services/api';
import { Button, Input, Card, Badge } from '../components/UI';
import { useSettings } from '../hooks/useSettings';

export default function Reports() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { settings } = useSettings();

  const fetchBookings = async () => {
    try {
      const data = await api.get('/api/bookings');
      // Fetch results for each booking to check for PDFs
      const bookingsWithPdfs = await Promise.all(data.map(async (b: any) => {
        const results = await api.get(`/api/results/${b.id}`);
        const pdfUrls = results.flatMap((r: any) => r.pdfUrls || []);
        return { ...b, pdfUrls };
      }));
      setBookings(bookingsWithPdfs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handlePrintReport = (bookingId: string) => {
    // In a real app, this would open a window and call window.print()
    alert('Generating report and opening print dialog...');
  };

  const filteredBookings = bookings.filter(b => 
    (b.billNumber || '').toLowerCase().includes(search.toLowerCase()) || 
    (b.patientName || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Lab Reports</h1>
          <p className="text-zinc-500">View and print patient test reports.</p>
        </div>
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

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full py-8 text-center text-zinc-500">Loading reports...</div>
        ) : filteredBookings.length === 0 ? (
          <div className="col-span-full py-8 text-center text-zinc-500">No records found.</div>
        ) : filteredBookings.map((booking) => (
          <Card key={booking.id} className="p-6 transition-all hover:shadow-md">
            <div className="flex justify-between items-start mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 text-white">
                <FileText className="h-5 w-5" />
              </div>
              <Badge variant={booking.status === 'completed' ? 'success' : 'warning'}>
                 {booking.status.toUpperCase()}
              </Badge>
            </div>

            <div className="space-y-2 mb-6">
              <p className="text-sm font-mono text-zinc-400 uppercase tracking-tighter">{booking.billNumber}</p>
              <h3 className="text-lg font-bold text-zinc-900">{booking.patientName}</h3>
              <p className="text-xs text-zinc-500 font-medium italic">{new Date(booking.createdAt).toLocaleString()}</p>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                {booking.pdfUrls && booking.pdfUrls.length > 0 ? (
                  <Button 
                    as="a"
                    href={booking.pdfUrls[0]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 gap-2 text-xs h-9 bg-emerald-600 hover:bg-emerald-700"
                  >
                    <FileText className="h-4 w-4" />
                    {booking.pdfUrls.length > 1 ? `View PDF (1 of ${booking.pdfUrls.length})` : 'View PDF'}
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    className="flex-1 gap-2 text-xs h-9"
                    onClick={() => handlePrintReport(booking.id)}
                  >
                    <Printer className="h-4 w-4" />
                    Print Report
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  className="flex-1 gap-2 text-xs h-9"
                  onClick={() => alert('Downloading invoice PDF...')}
                >
                  <Download className="h-4 w-4" />
                  Invoice
                </Button>
              </div>
              
              {booking.pdfUrls && booking.pdfUrls.length > 1 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {booking.pdfUrls.slice(1).map((url: string, i: number) => (
                    <a 
                      key={i} 
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[10px] bg-zinc-100 px-2 py-1 rounded hover:bg-zinc-200 transition-colors text-zinc-600 font-medium"
                    >
                      Extra Doc {i + 1}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
