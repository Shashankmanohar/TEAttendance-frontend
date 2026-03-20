import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, CreditCard, Settings, Users, Percent, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const billingNavItems = [
  { path: '/billing', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/billing/fee-structures', label: 'Fee Structures', icon: Settings },
  { path: '/billing/invoices', label: 'Invoices', icon: FileText },
  { path: '/billing/payments', label: 'Payments', icon: CreditCard },
  { path: '/billing/discounts', label: 'Discounts', icon: Percent },
  { path: '/billing/fines', label: 'Fines', icon: AlertTriangle },
  { path: '/billing/student-profile', label: 'Student Profile', icon: Users },
];

export function BillingNav() {
  const location = useLocation();

  return (
    <div className="border-b border-border bg-background">
      <div className="container mx-auto px-4">
        <nav className="flex items-center gap-1 overflow-x-auto py-1">
          {billingNavItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== '/billing' && location.pathname.startsWith(item.path));
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm whitespace-nowrap',
                  isActive
                    ? 'font-semibold bg-accent text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
