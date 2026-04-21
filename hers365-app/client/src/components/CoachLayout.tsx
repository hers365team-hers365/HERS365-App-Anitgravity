import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  CircleGauge, 
  Users, 
  Search, 
  MessageSquare, 
  ClipboardList, 
  BarChart3, 
  ShieldCheck,
  Settings,
  Bell,
  UserCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

export const CoachLayout = () => {
  const location = useLocation();

  const menuItems = [
    { icon: CircleGauge, label: 'Dashboard', path: '/coach/dashboard' },
    { icon: Search, label: 'Player Search', path: '/coach/search' },
    { icon: ClipboardList, label: 'Scouting Board', path: '/coach/board' },
    { icon: BarChart3, label: 'Analytics', path: '/coach/analytics' },
    { icon: Users, label: 'My Roster', path: '/coach/roster' },
    { icon: MessageSquare, label: 'Messages', path: '/coach/messages' },
  ];

  return (
    <div className="flex h-screen bg-dark-900 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-dark-800 border-r border-white/5 flex flex-col p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-10 px-2 transition-transform hover:scale-105">
          <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.3)]">
            <ShieldCheck className="text-white fill-current" size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tighter uppercase text-white">Coach Portal</h2>
            <p className="text-[10px] text-dark-400 font-bold uppercase tracking-[0.2em]">Recruiting Suite</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}>
                <motion.div
                  whileHover={{ x: 5 }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive 
                      ? 'bg-accent/10 border border-accent/30 text-accent shadow-[0_0_15px_rgba(34,197,94,0.1)]' 
                      : 'text-dark-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <item.icon size={20} className={isActive ? 'animate-pulse' : ''} />
                  <span className="font-semibold tracking-wide">{item.label}</span>
                </motion.div>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-2 pt-6 border-t border-white/5">
          <Link to="/coach/settings" className="flex items-center gap-3 px-4 py-3 text-dark-400 hover:text-white transition-colors">
            <Settings size={20} />
            <span className="font-medium">Settings</span>
          </Link>
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-dark-700 flex items-center justify-center border border-white/10">
              <UserCircle className="text-dark-400" size={24} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate text-white">Coach Anderson</p>
              <p className="text-[10px] text-accent font-bold uppercase tracking-wider">Premium Access</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px] pointer-events-none -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-500/5 rounded-full blur-[120px] pointer-events-none -ml-48 -mb-48" />

        <header className="h-20 flex items-center justify-between px-8 z-10 border-b border-white/5 backdrop-blur-md">
          <h1 className="text-2xl font-bold tracking-tight text-white leading-none">
            {menuItems.find(i => i.path === location.pathname)?.label || 'Overview'}
          </h1>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/20 rounded-full">
              <div className="w-2 h-2 bg-accent rounded-full animate-ping" />
              <span className="text-[10px] font-black text-accent uppercase tracking-widest">System Active</span>
            </div>
            <button className="relative text-dark-300 hover:text-white transition-colors">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 relative z-0 scroll-smooth">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
