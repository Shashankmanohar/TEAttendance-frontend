import { NavLink, useLocation } from 'react-router-dom';
import { QrCode, LayoutDashboard, UserPlus, Users, ClipboardList, Menu, X, Receipt, Database, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

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
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-[260px] flex-col border-r border-border bg-card z-50">
        <div className="flex items-center gap-3 px-6 h-16 border-b border-border">
          <div className="w-8 h-8 rounded-xl bg-foreground flex items-center justify-center">
            <QrCode className="w-4 h-4 text-background" />
          </div>
          <div>
            <p className="font-semibold text-sm tracking-tight">QR Attend</p>
            <p className="text-[11px] text-muted-foreground">Attendance System</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="px-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Menu</p>
          {navItems.map((item) => {
            const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150',
                  isActive
                    ? 'bg-foreground text-background font-medium shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="rounded-xl bg-muted/60 p-3">
            <p className="text-[11px] font-medium text-muted-foreground">System Status</p>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-success" />
              <span className="text-xs text-foreground">Online</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-50 w-full border-b border-border bg-card/90 backdrop-blur-xl">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-foreground flex items-center justify-center">
              <QrCode className="w-3.5 h-3.5 text-background" />
            </div>
            <span className="font-semibold text-sm">QR Attend</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl hover:bg-accent transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <nav className="border-t border-border bg-card p-3 space-y-0.5">
            {navItems.map((item) => {
              const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors',
                    isActive
                      ? 'bg-foreground text-background font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                >
                  <item.icon className="w-[18px] h-[18px]" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        )}
      </header>
    </>
  );
}
