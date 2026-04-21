import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  TestTube2, 
  CalendarCheck, 
  CreditCard,
  FileText, 
  Settings, 
  UserCog, 
  LogOut,
  FlaskConical,
  X
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useSettings } from '../hooks/useSettings';
import { cn } from '../utils/cn';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['admin', 'staff'] },
    { name: 'Patients', icon: Users, path: '/patients', roles: ['admin', 'staff'] },
    { name: 'Tests', icon: TestTube2, path: '/tests', roles: ['admin', 'staff'] },
    { name: 'Bookings', icon: CalendarCheck, path: '/bookings', roles: ['admin', 'staff'] },
    { name: 'Billing', icon: CreditCard, path: '/billing', roles: ['admin', 'staff'] },
    { name: 'Result Entry', icon: FlaskConical, path: '/results', roles: ['admin', 'staff'] },
    { name: 'Reports', icon: FileText, path: '/reports', roles: ['admin', 'staff'] },
    { name: 'Staff', icon: UserCog, path: '/staff', roles: ['admin'] },
    { name: 'Settings', icon: Settings, path: '/settings', roles: ['admin'] },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-zinc-900/50 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={cn(
        "fixed left-0 top-0 z-50 h-screen w-64 border-r border-zinc-200 bg-white transition-transform duration-300 ease-in-out lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-16 items-center justify-between border-b border-zinc-100 px-6">
          <h1 className="text-xl font-bold text-zinc-900 truncate">{settings?.labName || 'BioLab Pro'}</h1>
          <button onClick={onClose} className="lg:hidden">
            <X className="h-5 w-5 text-zinc-500" />
          </button>
        </div>
        
        <nav className="flex flex-col gap-1 p-4 overflow-y-auto h-[calc(100vh-160px)]">
          {menuItems.filter(item => item.roles.includes(user?.role || '')).map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => {
                if (window.innerWidth < 1024) onClose();
              }}
              className={({ isActive }) => cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive 
                  ? "bg-zinc-900 text-zinc-50" 
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full border-t border-zinc-100 p-4 bg-white">
          <div className="mb-4 flex items-center gap-3 px-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-600 shrink-0">
              {user?.name?.[0].toUpperCase()}
            </div>
            <div className="flex flex-col overflow-hidden leading-tight">
              <span className="truncate text-sm font-medium text-zinc-900">{user?.name}</span>
              <span className="text-[10px] text-zinc-500 capitalize">{user?.role}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};
