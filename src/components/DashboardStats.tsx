import { useState, useEffect } from 'react';
import { Users, Calendar, CheckCircle2, Clock, ArrowUpRight } from 'lucide-react';
import { getAttendanceRecords, getTodayDateKey, getStudents } from '@/lib/attendanceStore';
import { motion } from 'framer-motion';

export function DashboardStats() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    todayPresent: 0,
    totalRecords: 0,
    uniqueDays: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [students, records] = await Promise.all([
          getStudents(),
          getAttendanceRecords()
        ]);
        
        const today = getTodayDateKey();
        const todayRecords = records.filter(r => r.date === today && r.status === 'You Can Enter');
        const uniqueDays = new Set(records.map(r => r.date)).size;

        setStats({
          totalStudents: students.length,
          todayPresent: todayRecords.length,
          totalRecords: records.length,
          uniqueDays: uniqueDays,
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
  }, []);

  const statCards = [
    { title: 'Total Students', value: stats.totalStudents, icon: Users, color: '#8424bd', bg: 'bg-purple-50' },
    { title: 'Present Today', value: stats.todayPresent, icon: CheckCircle2, color: '#10b981', bg: 'bg-emerald-50' },
    { title: 'Total Records', value: stats.totalRecords, icon: Calendar, color: '#6366f1', bg: 'bg-indigo-50' },
    { title: 'Days Tracked', value: stats.uniqueDays, icon: Clock, color: '#f59e0b', bg: 'bg-amber-50' },
  ];

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, index) => (
        <motion.div 
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="group bg-white p-7 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-purple-100 hover:-translate-y-2 transition-all duration-500 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowUpRight className="w-5 h-5 text-slate-300" />
          </div>
          
          <div className="flex items-center justify-between mb-6">
            <div className={`w-14 h-14 rounded-2xl ${stat.bg} flex items-center justify-center transition-transform group-hover:scale-110 duration-500`}>
              <stat.icon className="w-7 h-7" style={{ color: stat.color }} />
            </div>
          </div>
          
          <div className="space-y-1">
            <h3 className="text-4xl font-black text-slate-900 tracking-tight">
              {isLoading ? (
                <div className="h-10 w-16 bg-slate-100 animate-pulse rounded-lg" />
              ) : stat.value}
            </h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{stat.title}</p>
          </div>
          
          <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-100" />
              ))}
            </div>
            <span className="text-[10px] font-bold text-slate-400">Updated just now</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
