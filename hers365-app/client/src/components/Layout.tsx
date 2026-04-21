import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Trophy, 
  User, 
  Dumbbell, 
  Search, 
  Users, 
  Bell, 
  Settings, 
  MessageSquare,
  Shield,
  Menu,
  X,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SidebarItem = ({ icon: Icon, label, path, active, collapsed }: any) => (
  <Link to={path} className="block">
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
        active 
          ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' 
          : 'text-dark-300 hover:bg-white/5 hover:text-white'
      }`}
    >
      <Icon size={22} className={active ? 'animate-pulse' : ''} />
      {!collapsed && (
        <span className="font-medium tracking-wide">{label}</span>
      )}
    </motion.div>
  </Link>
);

export const Layout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const menuItems = [
    { icon: Home, label: 'Feed', path: '/' },
    { icon: Trophy, label: 'Rankings', path: '/rankings' },
    { icon: User, label: 'Profile', path: '/profile' },
    { icon: Dumbbell, label: 'Training', path: '/training' },
    { icon: Search, label: 'Recruiting', path: '/recruiting' },
    { icon: Users, label: 'Teams', path: '/teams' },
    { icon: Shield, label: 'Compliance', path: '/audit' },
  ];

  return (
    <div className="flex h-screen bg-dark-900 text-white overflow-hidden cyber-grid">
      {/* Sidebar - Desktop */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 80 : 280 }}
        className="hidden md:flex flex-col bg-dark-800/50 backdrop-blur-xl border-r border-white/5 p-4 relative z-20"
      >
        <div className="flex items-center gap-3 px-2 mb-10">
          <div className="w-10 h-10 bg-brand-500 rounded-lg flex items-center justify-center shadow-lg shadow-brand-500/40">
            <Zap className="text-white fill-current" size={24} />
          </div>
          {!collapsed && (
            <span className="text-xl font-bold tracking-tighter text-gradient-glow uppercase">HERS365</span>
          )}
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => (
            <SidebarItem
              key={item.path}
              {...item}
              active={location.pathname === item.path}
              collapsed={collapsed}
            />
          ))}
        </nav>

        <div className="mt-auto space-y-2 pt-4 border-t border-white/5">
          <SidebarItem 
            icon={Settings} 
            label="Settings" 
            path="/settings" 
            active={location.pathname === '/settings'}
            collapsed={collapsed}
          />
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center gap-3 px-4 py-3 text-dark-400 hover:text-white transition-colors"
          >
            {collapsed ? <Menu size={22} /> : <X size={22} />}
            {!collapsed && <span className="font-medium">Collapse</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-dark-900/50 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 text-dark-300"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-lg font-semibold tracking-tight">
              {menuItems.find(i => i.path === location.pathname)?.label || 'Platform'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search athletes, drills..." 
                className="hidden lg:block w-64 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-brand-500/50 transition-all"
              />
            </div>
            <button className="p-2 text-dark-300 hover:text-white transition-colors">
              <Bell size={20} />
            </button>
            <button className="p-2 text-dark-300 hover:text-white transition-colors relative">
              <MessageSquare size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-brand-500 rounded-full"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-accent shadow-lg shadow-brand-500/20 cursor-pointer"></div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 scroll-smooth">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
            />
            <motion.nav
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="fixed inset-y-0 left-0 w-72 bg-dark-800 z-40 p-6 flex flex-col md:hidden"
            >
              <div className="flex items-center justify-between mb-10">
                <span className="text-xl font-bold tracking-tighter uppercase text-gradient">HERS365</span>
                <button onClick={() => setMobileMenuOpen(false)}>
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-4">
                {menuItems.map((item) => (
                  <Link 
                    key={item.path} 
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-4 text-lg font-medium text-dark-300 hover:text-white"
                  >
                    <item.icon size={24} />
                    {item.label}
                  </Link>
                ))}
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
