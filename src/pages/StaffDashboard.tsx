import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { staffApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, UserCheck, Activity, Award } from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import StaffAttendanceCalendar from '../components/StaffAttendanceCalendar';

export default function StaffDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [viewDate, setViewDate] = useState(new Date());

  const fetchAttendance = async () => {
    try {
      const response = await staffApi.getAttendance();
      setAttendanceRecords(response.data);
    } catch (error) {
      console.error('Failed to fetch attendance', error);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const monthlyStats = useMemo(() => {
    const start = startOfMonth(viewDate);
    const end = endOfMonth(viewDate);
    
    const monthlyRecords = attendanceRecords.filter(r => {
      const recordDate = new Date(r.date);
      return isWithinInterval(recordDate, { start, end }) && r.status === 'Present';
    });

    const isCurrentMonth = format(new Date(), 'yyyy-MM') === format(viewDate, 'yyyy-MM');
    const totalDaysInMonthSoFar = isCurrentMonth ? new Date().getDate() : end.getDate(); 
    const attendancePercentage = Math.round((monthlyRecords.length / totalDaysInMonthSoFar) * 100);

    return {
      count: monthlyRecords.length,
      percentage: attendancePercentage > 100 ? 100 : attendancePercentage,
      monthLabel: format(viewDate, 'MMMM')
    };
  }, [attendanceRecords, viewDate]);

  return (
    <div className="page-container space-y-8">
      <div className="page-header flex justify-between items-end">
        <div>
          <p className="page-subtitle font-black text-[#8424bd] mb-1">STAFF PORTAL</p>
          <h1 className="page-title text-4xl font-black text-slate-900 leading-tight">Welcome, {user?.name}</h1>
          <p className="text-slate-500 font-medium">Manage your attendance and view records</p>
        </div>
        <div className="hidden md:flex flex-col items-end">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Today's Date</p>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
            <CalendarIcon className="w-4 h-4 text-[#8424bd]" />
            <span className="font-bold text-slate-700">{format(new Date(), 'MMMM dd, yyyy')}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-xl shadow-purple-100/20 flex items-center gap-5"
        >
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
            <UserCheck className="w-7 h-7 text-emerald-500" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Days Present</p>
            <h3 className="text-3xl font-black text-slate-900 leading-none">{monthlyStats.count}</h3>
            <p className="text-[9px] font-bold text-emerald-600 mt-1">{monthlyStats.monthLabel}</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-xl shadow-purple-100/20 flex items-center gap-5"
        >
          <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center shrink-0">
            <Activity className="w-7 h-7 text-[#8424bd]" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Attendance Rate</p>
            <h3 className="text-3xl font-black text-slate-900 leading-none">{monthlyStats.percentage}%</h3>
            <p className="text-[9px] font-bold text-[#8424bd] mt-1">{monthlyStats.monthLabel}</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-xl shadow-purple-100/20 flex items-center gap-5"
        >
          <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0">
            <Award className="w-7 h-7 text-amber-500" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Performance</p>
            <h3 className="text-3xl font-black text-slate-900 leading-none">
              {monthlyStats.percentage >= 90 ? 'Excellent' : 
               monthlyStats.percentage >= 75 ? 'Good' : 
               monthlyStats.percentage >= 50 ? 'Average' : 'Critical'}
            </h3>
            <p className="text-[9px] font-bold text-amber-600 mt-1">System Status</p>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <Card className="border-none shadow-2xl shadow-purple-100/50 rounded-[32px] overflow-hidden bg-white">
          <CardHeader>
            <CardTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-[#8424bd]" />
              Attendance History
            </CardTitle>
            <CardDescription className="font-medium">Monthly overview of your work days</CardDescription>
          </CardHeader>
          <CardContent>
            <StaffAttendanceCalendar 
              records={attendanceRecords} 
              currentDate={viewDate}
              setCurrentDate={setViewDate}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
