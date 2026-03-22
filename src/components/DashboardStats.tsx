import { useState, useEffect } from 'react';
import { Users, Calendar, CheckCircle2, Clock, ArrowUpRight, UserCheck } from 'lucide-react';
import { format } from 'date-fns';
import { getAttendanceRecords, getTodayDateKey, getStudents } from '@/lib/attendanceStore';
import { staffApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';

interface DashboardStatsProps {
  viewDate?: Date;
}

export function DashboardStats({ viewDate = new Date() }: DashboardStatsProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [stats, setStats] = useState({
    totalStudents: 0,
    totalStaff: 0,
    todayPresent: 0,
    totalRecords: 0,
    uniqueDays: 0,
    monthlyPresence: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const fetchPromises: Promise<any>[] = [
          getStudents(),
        ];

        if (isAdmin) {
          fetchPromises.push(staffApi.getAllStaff());
        }

        const [students, staffResponse] = await Promise.all(fetchPromises);
        
        const attendanceResponse = await getAttendanceRecords();
        const records = Array.isArray(attendanceResponse) ? attendanceResponse : (attendanceResponse.history || []);
        
        // Calculate monthly presence for the selected viewDate
        const viewMonthPrefix = format(viewDate, 'yyyy-MM');
        const monthlyPresence = records.filter(r => 
          r.date.startsWith(viewMonthPrefix) && 
          (r.status === 'You Can Enter' || r.status === 'Present' || r.type === 'staff')
        ).length;
        
        const today = getTodayDateKey();
        const todayRecords = records.filter(r => r.date === today && (r.status === 'You Can Enter' || r.status === 'Present' || r.type === 'staff'));
        const uniqueDays = new Set(records.map(r => r.date)).size;

        setStats({
          totalStudents: students.length,
          totalStaff: isAdmin ? (staffResponse?.data?.length || 0) : 0,
          todayPresent: todayRecords.length,
          totalRecords: records.length,
          uniqueDays: uniqueDays,
          monthlyPresence: monthlyPresence,
        });
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadStats();
    const interval = setInterval(loadStats, 10000);
    return () => clearInterval(interval);
  }, [isAdmin, viewDate]);

  const statCards = [
    ...(isAdmin ? [{ title: 'Total Staff', value: stats.totalStaff, icon: UserCheck, color: '#8424bd', bg: 'bg-purple-50' }] : []),
    { title: 'Total Students', value: stats.totalStudents, icon: Users, color: '#6366f1', bg: 'bg-indigo-50' },
    { title: 'Present Today', value: stats.todayPresent, icon: CheckCircle2, color: '#10b981', bg: 'bg-emerald-50' },
    { title: 'Total Records', value: stats.totalRecords, icon: Calendar, color: '#f59e0b', bg: 'bg-amber-50' },
    ...(!isAdmin ? [{ title: `Days Present (${format(viewDate, 'MMM')})`, value: stats.monthlyPresence, icon: CheckCircle2, color: '#8424bd', bg: 'bg-purple-50' }] : []),
  ];

  return (
    <div className={`grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 ${isAdmin ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
      {statCards.map((stat, index) => (
        <motion.div 
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, type: "spring", stiffness: 100 }}
          className="stat-card group relative overflow-hidden !p-5 md:!p-6 bg-white border border-slate-100 rounded-[32px] shadow-xl shadow-purple-100/20"
        >
          <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-2 group-hover:translate-x-0">
            <ArrowUpRight className="w-4 h-4 text-slate-300" />
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 rounded-[18px] ${stat.bg} flex items-center justify-center transition-all duration-700 group-hover:rounded-full group-hover:scale-105 shadow-sm`}>
              <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
            </div>
          </div>
          
          <div className="space-y-0.5 relative z-10">
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter tabular-nums leading-none">
              {isLoading ? (
                <div className="h-9 w-16 bg-slate-50 animate-pulse rounded-xl" />
              ) : stat.value}
            </h3>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em]">{stat.title}</p>
          </div>
          

          <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-slate-50 rounded-full opacity-50 group-hover:scale-125 transition-transform duration-1000" />
        </motion.div>
      ))}
    </div>
  );
}
