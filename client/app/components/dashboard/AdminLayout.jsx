import React, { useState } from 'react';
import {
  LayoutDashboard, Box, Utensils, Trash2,
  ClipboardList, LogOut, Menu, X
} from 'lucide-react';
import { Link, useLocation, Outlet } from "react-router";
import NotificationBell from '../notifications/NotificationBell';
// import {  } from "react-router-dom";

const AdminLayout = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
    { id: 'ingredients', label: 'Ingredients', icon: <Box size={20} />, path: '/ingredients' },
    { id: 'recipes', label: 'Recipes', icon: <Utensils size={20} />, path: '/recipes' },
    { id: 'logs', label: 'Consumption', icon: <ClipboardList size={20} />, path: '/consumption' },
    { id: 'waste', label: 'Waste Management', icon: <Trash2 size={20} />, path: '/waste' },
  ];

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const handleLogout = () => {
    // Clear JWT token and any other user data from localStorage or context
    localStorage.removeItem('token');
    // Redirect to login page
    window.location.href = '/login';
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* --- Mobile Overlay --- */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* --- Sidebar --- */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-auto
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-emerald-400">Kitchen Pro</h1>
            <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">Admin Portal</p>
          </div>
          {/* Close button for mobile */}
          <button onClick={toggleMobileMenu} className="lg:hidden text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>


        <nav className="flex-1 px-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${location.pathname === item.path
                ? "bg-emerald-600 text-white"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button type='button'
            onClick={handleLogout}
            className="flex items-center space-x-3 text-slate-400 hover:text-red-400 px-4 py-2 w-full transition-colors">
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* --- Main Content --- */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Header Bar */}
        <header className="hidden lg:flex bg-white border-b border-slate-200 px-8 py-3 items-center justify-end sticky top-0 z-30">
          <NotificationBell />
        </header>

        {/* Mobile Header Bar */}
        <header className="lg:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-30">
          <h1 className="text-lg font-bold text-emerald-600">Kitchen Pro</h1>
          <span className='flex'>
            <NotificationBell></NotificationBell>
          
            <button
              onClick={toggleMobileMenu}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-md"
            >
              <Menu size={24} />
            </button>
          </span>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;