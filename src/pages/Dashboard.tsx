import { useState } from 'react';
import { DashboardStats } from '@/components/DashboardStats';
import { AttendanceLogs } from '@/components/AttendanceLogs';
import { ManagementQuickAccess } from '@/components/ManagementQuickAccess';
import { useAuth } from '@/context/AuthContext';
import { LayoutDashboard, ShieldCheck, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [viewDate, setViewDate] = useState(new Date());

  const todayStr = format(new Date(), 'EEEE, MMMM dd, yyyy');
  const viewMonthStr = format(viewDate, 'MMMM yyyy');

  const handlePrevMonth = () => setViewDate(prev => subMonths(prev, 1));
  const handleNextMonth = () => setViewDate(prev => addMonths(prev, 1));

  return (
    <div className="page-container space-y-12 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <div className="w-8 h-8 rounded-xl bg-[#8424bd]/5 flex items-center justify-center">
                <LayoutDashboard className="w-4 h-4 text-[#8424bd]" />
             </div>
             <p className="text-[10px] font-black text-[#8424bd] uppercase tracking-[0.2em]">{isAdmin ? 'Administrative Terminal' : 'Excellent Institution'}</p>
          </div>
          <h1 className="page-title text-3xl md:text-5xl flex flex-wrap items-center gap-3 md:gap-4">
             Dashboard 
             {isAdmin && (
               <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[8px] md:text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                  <ShieldCheck className="w-2.5 h-2.5 md:w-3 h-3" />
                  Privileged
               </div>
             )}
          </h1>
          <p className="page-subtitle text-slate-400 mt-1.5 md:mt-2">{todayStr}</p>
        </div>

        {!isAdmin && (
          <div className="flex items-center gap-4 bg-white p-2 rounded-[24px] border border-slate-100 shadow-sm self-stretch md:self-auto">
             <button 
              onClick={handlePrevMonth}
              className="p-3 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-[#8424bd] transition-all active:scale-90"
             >
                <ChevronLeft className="w-5 h-5" />
             </button>
             <div className="px-4 flex items-center gap-3 border-x border-slate-50">
                <CalendarIcon className="w-4 h-4 text-[#8424bd]" />
                <span className="font-black text-[11px] uppercase tracking-widest text-slate-700 min-w-[120px] text-center">{viewMonthStr}</span>
             </div>
             <button 
              onClick={handleNextMonth}
              className="p-3 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-[#8424bd] transition-all active:scale-90"
             >
                <ChevronRight className="w-5 h-5" />
             </button>
          </div>
        )}
      </div>

      <DashboardStats viewDate={viewDate} />

      {isAdmin && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
             <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Management <span className="text-[#8424bd]">Console</span></h2>
             <div className="h-px flex-1 bg-slate-50" />
          </div>
          <ManagementQuickAccess />
        </div>
      )}

      <div className="space-y-6 pt-4">
        <div className="flex items-center gap-4">
           <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">System <span className="text-[#8424bd]">Activity</span></h2>
           <div className="h-px flex-1 bg-slate-50" />
        </div>
        <AttendanceLogs />
      </div>
    </div>
  );
}
