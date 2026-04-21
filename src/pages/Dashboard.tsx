import React, { useEffect, useState } from 'react';
import { 
  Users, 
  TestTube2, 
  CalendarCheck, 
  TrendingUp,
  Activity,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { Card } from '../components/UI';

export default function Dashboard() {
  const [stats, setStats] = useState({
    patients: 0,
    tests: 0,
    bookings: 0,
    revenue: 0
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patients, tests, bookings] = await Promise.all([
          api.get('/api/patients'),
          api.get('/api/tests'),
          api.get('/api/bookings')
        ]);
        
        const revenue = bookings.reduce((sum: number, b: any) => sum + b.paid, 0);
        
        setStats({
          patients: patients.length,
          tests: tests.length,
          bookings: bookings.length,
          revenue
        });
      } catch (err) {
        console.error('Failed to fetch dashboard stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const statCards = [
    { name: 'Total Patients', value: stats.patients, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: 'Tests Available', value: stats.tests, icon: TestTube2, color: 'text-purple-600', bg: 'bg-purple-50' },
    { name: 'Bookings Today', value: stats.bookings, icon: CalendarCheck, color: 'text-amber-600', bg: 'bg-amber-50' },
    { name: 'Total Revenue', value: `$${stats.revenue.toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
        <p className="text-zinc-500">Welcome to your BioLab Pro overview.</p>
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
        <Card className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-900">Recent Activities</h2>
            <Activity className="h-4 w-4 text-zinc-400" />
          </div>
          <div className="space-y-4">
            <div className="text-sm text-zinc-500 italic">Recent activity logging coming soon...</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-900">Pending Approvals</h2>
            <AlertCircle className="h-4 w-4 text-zinc-400" />
          </div>
          <div className="space-y-4">
            <div className="text-sm text-zinc-500 italic">Pending approval list coming soon...</div>
          </div>
        </Card>
      </div>
    </div>
  );
}
