import { NavLink, useLocation } from 'react-router-dom';
import { QrCode, LayoutDashboard, UserPlus, Users, ClipboardList, Menu, X, ShieldCheck, LogOut, LogIn, User } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Overview & stats', roles: ['admin', 'teacher', 'student'] },
  { path: '/admin/scanner', label: 'Scanner', icon: QrCode, description: 'QR Verification', roles: ['admin'] },
  { path: '/register', label: 'Register', icon: UserPlus, description: 'Add students', roles: ['admin', 'teacher'] },
  { path: '/students', label: 'Students', icon: Users, description: 'Manage roster', roles: ['admin', 'teacher'] },
  { path: '/logs', label: 'Logs', icon: ClipboardList, description: 'Attendance records', roles: ['admin'] },
  { path: '/staff/dashboard', label: 'My Attendance', icon: ShieldCheck, description: 'Staff portal', roles: ['staff'] },
  { path: '/admin/staff', label: 'Staff Admin', icon: Users, description: 'Manage staff', roles: ['admin'] },
];

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
    navigate('/');
  };

  const visibleNavItems = navItems.filter(item => {
    if (!token || !user) return false;
    if (!item.roles) return true;
    return item.roles.includes(user.role);
  });

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-[280px] flex-col border-r border-white/40 bg-white/70 backdrop-blur-2xl shadow-[20px_0_60px_rgba(0,0,0,0.02)] z-50 overflow-hidden">
        {/* Abstract Background Accents */}
        <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-br from-[#8424bd]/5 via-purple-50/20 to-transparent pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-[#8424bd]/5 blur-[80px] rounded-full pointer-events-none animate-pulse" />
        <div className="absolute top-1/2 -right-32 w-48 h-48 bg-emerald-50/20 blur-[60px] rounded-full pointer-events-none" />

        <div className="flex items-center gap-4 px-7 h-28 relative z-10">
          <div className="relative group cursor-pointer active:scale-95 transition-all duration-500">
            <div className="w-13 h-13 rounded-[22px] bg-slate-900 flex items-center justify-center shadow-2xl shadow-slate-200 group-hover:rotate-6 transition-all duration-500">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-[3px] border-white shadow-lg animate-bounce" />
          </div>
          <div className="translate-y-0.5">
            <h1 className="font-black text-slate-950 leading-none tracking-tighter text-xl uppercase italic">EXCELLENT</h1>
            <div className="flex items-center gap-1.5 mt-1.5 px-2 py-0.5 bg-emerald-50 rounded-full w-fit border border-emerald-100/50">
              <span className="text-[8px] font-black text-emerald-600 uppercase tracking-[0.2em]">Live Terminal</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto scrollbar-hide relative z-10">
          <div className="px-5 mb-5 mt-2">
             <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.25em]">Registry Hub</p>
          </div>
          
          {visibleNavItems.map((item) => {
            const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  'group flex items-center gap-4 px-6 py-4 rounded-[22px] transition-all duration-500 relative overflow-hidden',
                  isActive 
                    ? 'text-[#8424bd] bg-purple-50/50' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50/80'
                )}
              >
                {isActive && (
                  <motion.div 
                    layoutId="navGlow"
                    className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent pointer-events-none"
                  />
                )}
                <item.icon className={cn(
                  "w-5 h-5 transition-all duration-500 shrink-0 relative z-10",
                  isActive ? "text-[#8424bd] scale-110" : "text-slate-400 group-hover:text-slate-600 group-hover:rotate-6"
                )} />
                <span className="flex-1 font-black tracking-[0.1em] text-[10px] uppercase truncate relative z-10">{item.label}</span>
                {isActive && (
                   <motion.div 
                     layoutId="navIndicator"
                     className="w-1.5 h-6 rounded-full bg-[#8424bd] shadow-[0_0_15px_rgba(132,36,189,0.4)] relative z-10"
                   />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Profile & Actions - Premium Redesign */}
        <div className="p-6 mt-auto border-t border-white/40 bg-white/40 backdrop-blur-sm">
          {token && user ? (
            <div className="space-y-5">
               <div className="p-4 bg-white/80 rounded-[24px] border border-white shadow-sm flex items-center gap-4 group/profile cursor-pointer hover:shadow-md transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-[#8424bd] flex items-center justify-center shrink-0 shadow-lg shadow-purple-100 group-hover:scale-110 transition-transform duration-500">
                     <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="overflow-hidden">
                     <p className="text-[11px] font-black text-slate-900 truncate uppercase tracking-tighter">{user.name}</p>
                     <div className="flex items-center gap-1.5 mt-0.5">
                       <ShieldCheck className="w-3 h-3 text-[#8424bd]" />
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{user.role}</p>
                     </div>
                  </div>
               </div>
               <button
                onClick={handleLogout}
                className="w-full group flex items-center justify-center gap-3 px-6 py-4 rounded-[22px] text-[10px] font-black uppercase tracking-[0.25em] text-center text-rose-500 hover:text-white bg-rose-50/50 hover:bg-rose-500 shadow-sm hover:shadow-rose-100 transition-all duration-500 active:scale-95"
              >
                <LogOut className="w-4 h-4" />
                <span>Terminate Session</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4 px-2 text-center">
               <p className="text-[10px] font-black text-[#8424bd] uppercase tracking-[0.2em] italic">EXCELLENT</p>
               <p className="text-[7px] font-bold text-slate-300 uppercase tracking-[0.1em] px-4 leading-relaxed">INSTITUTIONAL ATTENDANCE TERMINAL</p>
            </div>
          )}

          {/* Attribution Footer */}
          <div className="mt-8 pt-4 border-t border-slate-100/50">
            <a 
              href="https://webfloratechnologies.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group/attr flex flex-col items-center gap-1 opacity-40 hover:opacity-100 transition-all duration-500"
            >
              <span className="text-[7px] font-black uppercase tracking-[0.3em] text-slate-400 group-hover/attr:text-[#8424bd]">Developed By</span>
              <span className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-500 group-hover/attr:text-slate-900 transition-colors">webfloratechnologies.com</span>
            </a>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-50 w-full border-b border-slate-100 bg-white/95 backdrop-blur-xl">
        <div className="flex h-20 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-[16px] bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-200">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <span className="font-black text-slate-950 text-base tracking-tighter uppercase">Excellent</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-11 h-11 flex items-center justify-center rounded-[16px] bg-slate-50 text-slate-900 border border-slate-100 focus:ring-2 focus:ring-purple-100 transition-all"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.nav 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="absolute top-20 left-0 right-0 border-b border-slate-100 bg-white shadow-2xl p-4 space-y-1.5 z-[60] overflow-hidden"
            >
              {visibleNavItems.map((item) => {
                const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-4 px-5 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all',
                      isActive
                        ? 'bg-slate-900 text-white shadow-xl'
                        : 'text-slate-500 hover:bg-slate-50'
                    )}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
              {token ? (
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 transition-all font-outfit"
                >
                  <LogOut className="w-5 h-5 shrink-0" />
                  <span>Logout</span>
                </button>
              ) : (
                <div className="py-6 px-4 text-center">
                   <p className="text-[10px] font-black text-[#8424bd] uppercase tracking-widest italic">EXCELLENT ATTENDANCE</p>
                </div>
              )}
              
              {/* Mobile Attribution */}
              <div className="pt-6 pb-2 text-center border-t border-slate-50 mt-4">
                <a 
                  href="https://webfloratechnologies.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex flex-col items-center gap-0.5"
                >
                  <span className="text-[7px] font-black uppercase tracking-[0.3em] text-slate-300">Made By</span>
                  <span className="text-[10px] font-black text-slate-400 tracking-tight">webfloratechnologies.com</span>
                </a>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
