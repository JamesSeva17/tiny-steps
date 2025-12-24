
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: 'fa-chart-line' },
    { path: '/log', label: 'Log', icon: 'fa-plus-circle' },
    { path: '/history', label: 'History', icon: 'fa-history' },
    { path: '/settings', label: 'Settings', icon: 'fa-cog' },
  ];

  return (
    <div className="min-h-screen pb-20 md:pb-0 md:pl-64 bg-slate-50">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-200 z-50">
        <div className="p-6 flex items-center space-x-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
            <i className="fa-solid fa-baby text-xl"></i>
          </div>
          <h1 className="text-xl font-bold text-slate-800">TinySteps</h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                location.pathname === item.path
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <i className={`fa-solid ${item.icon}`}></i>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="p-4 md:p-8 max-w-5xl mx-auto">
        {children}
      </main>

      {/* Bottom Nav - Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around py-3 px-2 z-50">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center space-y-1 transition-all ${
              location.pathname === item.path
                ? 'text-indigo-600'
                : 'text-slate-400'
            }`}
          >
            <i className={`fa-solid ${item.icon} text-lg`}></i>
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Layout;
