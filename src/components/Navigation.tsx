import { NavLink, useLocation } from 'react-router-dom';
import { QrCode, LayoutDashboard, UserPlus, Users, ClipboardList, Menu, X, Receipt, Database, ChevronRight, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { path: '/', label: 'Scanner', icon: QrCode, description: 'Scan QR codes' },
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Overview & stats' },
  { path: '/register', label: 'Register', icon: UserPlus, description: 'Add students' },
  { path: '/students', label: 'Students', icon: Users, description: 'Manage roster' },
  { path: '/logs', label: 'Logs', icon: ClipboardList, description: 'Attendance records' },
];

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-[260px] flex-col border-r border-slate-100 bg-white/80 backdrop-blur-2xl z-50">
        <div className="flex items-center gap-3 px-6 h-20 border-b border-slate-50">
          <div className="w-10 h-10 rounded-2xl bg-[#8424bd] flex items-center justify-center shadow-lg shadow-purple-200">
            <QrCode className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-black text-slate-900 leading-tight">TEAM <span className="text-[#8424bd]">EXCELLENT</span></p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Attendance</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-1.5 overflow-y-auto">
          <p className="px-3 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4">Navigation Menu</p>
          {navItems.map((item) => {
            const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  'group flex items-center gap-3.5 px-4 py-3 rounded-[20px] text-sm transition-all duration-300 relative overflow-hidden',
                  isActive
                    ? 'text-white font-bold shadow-xl shadow-purple-100'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                )}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeNav"
                    className="absolute inset-0 bg-[#8424bd] z-0"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon className={cn(
                  "w-5 h-5 relative z-10 transition-transform group-hover:scale-110",
                  isActive ? "text-white" : "text-slate-400 group-hover:text-[#8424bd]"
                )} />
                <span className="relative z-10 flex-1">{item.label}</span>
                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white/40 relative z-10" />}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-6 border-t border-slate-50">
          <div className="rounded-3xl bg-slate-50 p-4 relative overflow-hidden group hover:bg-slate-100 transition-colors">
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full -mr-8 -mt-8" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Live Status</p>
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping opacity-40" />
              </div>
              <span className="text-xs font-black text-slate-700">System Online</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-50 w-full border-b border-border bg-white/80 backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#8424bd] flex items-center justify-center">
              <QrCode className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-slate-900 text-sm tracking-tight">TEAM EXCELLENT</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-900 border border-slate-100"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.nav 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-16 left-0 right-0 border-b border-border bg-white shadow-2xl p-4 space-y-1 z-[60] overflow-hidden"
            >
              {navItems.map((item) => {
                const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => {
                      console.log('Mobile menu closing via click on:', item.label);
                      setMobileMenuOpen(false);
                    }}
                    className={cn(
                      'flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all',
                      isActive
                        ? 'bg-[#8424bd] text-white shadow-lg shadow-purple-100'
                        : 'text-slate-500 hover:bg-slate-50'
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </motion.nav>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
