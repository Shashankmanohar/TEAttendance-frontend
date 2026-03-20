import { useState, useEffect } from 'react';
import { Users, Calendar, CheckCircle2, Clock } from 'lucide-react';
import { getAttendanceRecords, getTodayDateKey, getStudents } from '@/lib/attendanceStore';

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
    { title: 'Total Students', value: stats.totalStudents, icon: Users, accent: 'bg-indigo-50 text-indigo-600' },
    { title: 'Present Today', value: stats.todayPresent, icon: CheckCircle2, accent: 'bg-emerald-50 text-emerald-600' },
    { title: 'Total Records', value: stats.totalRecords, icon: Calendar, accent: 'bg-slate-50 text-slate-600' },
    { title: 'Days Tracked', value: stats.uniqueDays, icon: Clock, accent: 'bg-amber-50 text-amber-600' },
  ];

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => (
        <div key={stat.title} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-xl transition-all hover:shadow-2xl hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 rounded-2xl ${stat.accent} flex items-center justify-center`}>
              <stat.icon className="w-6 h-6" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 tracking-tight">
            {isLoading ? '—' : stat.value}
          </p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{stat.title}</p>
        </div>
      ))}
    </div>
  );
}
