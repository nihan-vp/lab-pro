import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { SettingsProvider } from './hooks/useSettings';
import { Sidebar } from './components/Sidebar';
import { Menu } from 'lucide-react';
import { useSettings } from './hooks/useSettings';

// Pages
import Login from './pages/Login';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Tests from './pages/Tests';
import Bookings from './pages/Bookings';
import Billing from './pages/Billing';
import ResultEntry from './pages/ResultEntry';
import Reports from './pages/Reports';
import StaffManagement from './pages/StaffManagement';
import Settings from './pages/Settings';
import LabsManagement from './pages/LabsManagement';

const ProtectedRoute = ({ children, roles }: { children: React.ReactNode; roles?: string[] }) => {
  const { user, loading } = useAuth();
  const { settings } = useSettings();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-zinc-50 lg:pl-64">
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-zinc-200 bg-white px-4 lg:hidden">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="rounded-lg p-2 hover:bg-zinc-100"
          >
            <Menu className="h-5 w-5 text-zinc-600" />
          </button>
          <span className="font-bold text-zinc-900 truncate max-w-[150px]">
            {settings?.labName || 'BioLab Pro'}
          </span>
        </div>
      </header>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
        {children}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/patients" element={
              <ProtectedRoute>
                <Patients />
              </ProtectedRoute>
            } />

            <Route path="/tests" element={
              <ProtectedRoute>
                <Tests />
              </ProtectedRoute>
            } />

            <Route path="/bookings" element={
              <ProtectedRoute>
                <Bookings />
              </ProtectedRoute>
            } />

            <Route path="/billing" element={
              <ProtectedRoute>
                <Billing />
              </ProtectedRoute>
            } />

            <Route path="/results" element={
              <ProtectedRoute>
                <ResultEntry />
              </ProtectedRoute>
            } />

            <Route path="/reports" element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            } />

            <Route path="/staff" element={
              <ProtectedRoute roles={['admin']}>
                <StaffManagement />
              </ProtectedRoute>
            } />

            <Route path="/settings" element={
              <ProtectedRoute roles={['admin']}>
                <Settings />
              </ProtectedRoute>
            } />

            <Route path="/super/labs" element={
              <ProtectedRoute roles={['superadmin']}>
                <LabsManagement />
              </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </SettingsProvider>
    </AuthProvider>
  );
}
