import React, { useEffect, useState } from 'react';
import { 
  Users, 
  TestTube2, 
  CalendarCheck, 
  TrendingUp,
  Activity,
  AlertCircle,
  Clock,
  ArrowRight,
  CheckCircle2,
  Plus,
  ArrowUpRight
} from 'lucide-react';
import { api } from '../services/api';
import { Card, Button } from '../components/UI';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    patients: 0,
    tests: 0,
    bookings: 0,
    revenue: 0
  });
  const [activities, setActivities] = useState<any[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patients, tests, bookings, recentActivities] = await Promise.all([
          api.get('/api/patients'),
          api.get('/api/tests'),
          api.get('/api/bookings'),
          api.get('/api/dashboard/recent-activities')
        ]);
        
        const revenue = bookings.reduce((sum: number, b: any) => sum + b.paid, 0);
        
        setStats({
          patients: patients.length,
          tests: tests.length,
          bookings: bookings.filter((b: any) => {
            const today = new Date().setHours(0,0,0,0);
            return new Date(b.createdAt).getTime() >= today;
          }).length,
          revenue
        });

        setRecentBookings(bookings.slice(0, 5));
        setActivities(recentActivities);

        // Fetch pending approvals for everyone now (backend updated)
        const pending = await api.get('/api/dashboard/pending-approvals');
        setPendingApprovals(pending);
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const statCards = [
    { name: 'Total Patients', value: stats.patients, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: 'Tests Available', value: stats.tests, icon: TestTube2, color: 'text-purple-600', bg: 'bg-purple-50' },
    { name: 'Bookings Today', value: stats.bookings, icon: CalendarCheck, color: 'text-amber-600', bg: 'bg-amber-50' },
    { name: 'Total Revenue', value: `$${stats.revenue.toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <Clock className="h-8 w-8 animate-spin text-zinc-400" />
        <p className="text-sm text-zinc-500">Loading your dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
          <p className="text-zinc-500">Welcome back, <span className="font-semibold">{user?.name}</span>. Here's your overview.</p>
        </div>
        <Link to="/bookings">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Booking
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.name} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-500">{stat.name}</p>
                <p className="mt-1 text-2xl font-bold text-zinc-900">{stat.value}</p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="flex flex-col p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-900">Recent Activities</h2>
            <Activity className="h-4 w-4 text-zinc-400" />
          </div>
          <div className="flex-1 space-y-4">
            {activities.length > 0 ? (
              activities.map((activity, idx) => (
                <div key={`${activity.type}-${activity.id}-${idx}`} className="flex gap-4 border-l-2 border-zinc-100 pl-4 py-1">
                  <div className="flex-1">
                    <p className="text-sm text-zinc-900">{activity.message}</p>
                    <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider mt-1">
                      {new Date(activity.date).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm text-zinc-500">No recent activities found.</p>
              </div>
            )}
          </div>
        </Card>

        <Card className="flex flex-col p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-900">Pending Approvals</h2>
            <AlertCircle className="h-4 w-4 text-zinc-400" />
          </div>
          <div className="flex-1 space-y-4">
            {pendingApprovals.length > 0 ? (
              pendingApprovals.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg border border-zinc-100 p-3 hover:bg-zinc-50 transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">{item.testName}</p>
                    <p className="text-xs text-zinc-500">{item.patientName} ({item.billNumber})</p>
                  </div>
                  <Link to="/results">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ))
            ) : (
              <div className="py-8 text-center">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500 mb-2" />
                <p className="text-sm text-zinc-500">All results have been approved.</p>
              </div>
            )}
          </div>
          {pendingApprovals.length > 0 && (
            <div className="mt-6 border-t border-zinc-100 pt-4">
              <Link to="/results">
                <Button variant="ghost" className="w-full text-zinc-600 text-xs">
                  {user?.role === 'admin' ? 'Review results in Result Entry' : 'View queue in Result Entry'}
                </Button>
              </Link>
            </div>
          )}
        </Card>
      </div>

      {/* Recent Bookings Table */}
      <Card className="overflow-hidden">
        <div className="border-b border-zinc-100 bg-zinc-50/50 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-900">Recent Bookings</h2>
            <Link to="/bookings">
              <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-zinc-900">
                View All <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-zinc-100 bg-zinc-50/50 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-6 py-4">Bill #</th>
                <th className="px-6 py-4">Patient</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {recentBookings.length > 0 ? (
                recentBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="whitespace-nowrap px-6 py-4 font-mono text-xs font-bold text-zinc-600">
                      {booking.billNumber}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-zinc-900">
                      {booking.patientName}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        booking.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-bold text-zinc-900">
                      ${booking.finalTotal}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-zinc-500">
                    No bookings recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
