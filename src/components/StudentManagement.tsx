import { useState, useEffect, useCallback } from 'react';
import { Users, UserCheck, UserX, RefreshCw, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StudentList } from './StudentList';
import { motion } from 'framer-motion';
import { getAttendanceRecords, getTodayDateKey, getStudents, AttendanceRecord } from '@/lib/attendanceStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';

export function StudentManagement() {
  const [stats, setStats] = useState({ totalStrength: 0, present: 0, absent: 0 });
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [batchCount, setBatchCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // For now, we'll keep stats simplified or fetch from backend soon
  // Let's assume stats come from attendance records of today
  const refreshStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const [allRecords, students] = await Promise.all([
        getAttendanceRecords(getTodayDateKey()),
        getStudents()
      ]);
      
      setRecords(allRecords);
      const presentCount = allRecords.filter(r => r.status === 'You Can Enter').length;
      const batches = new Set(students.map(s => s.class_id)).size;
      
      setStats({
        totalStrength: students.length,
        present: presentCount,
        absent: students.length - presentCount
      });
      setBatchCount(batches);
    } catch (error) {
      console.error('Error refreshing stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  return (
    <div className="w-full space-y-8 animate-in fade-in zoom-in duration-700">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <p className="page-subtitle">Administrative Control</p>
          <h1 className="page-title text-2xl">Management <span className="premium-text-gradient">Console</span></h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-4 py-2 bg-white border border-slate-100 rounded-xl shadow-sm flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[9px] font-black text-slate-500 tracking-widest uppercase">Live Feed</span>
          </div>
          <Button variant="outline" size="icon" onClick={refreshStats} disabled={isLoading} className="h-10 w-10 rounded-xl bg-white border-slate-100 hover:bg-slate-50 shadow-sm transition-all duration-300">
            <RefreshCw className={`w-4 h-4 text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Strength', value: stats.totalStrength, icon: Users, bg: 'bg-purple-50', color: 'text-purple-600', border: 'border-purple-100/50' },
          { label: 'Scanned Today', value: records.length, icon: UserCheck, bg: 'bg-emerald-50', color: 'text-emerald-600', border: 'border-emerald-100/50' },
          { label: 'Active Batches', value: batchCount, icon: ShieldCheck, bg: 'bg-amber-50', color: 'text-amber-600', border: 'border-amber-100/50' }
        ].map((item, i) => (
          <motion.div 
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="group bg-white p-6 rounded-[24px] border border-slate-50 shadow-lg shadow-slate-200/30 hover:shadow-xl hover:shadow-purple-100/30 transition-all duration-500 flex items-center gap-5 relative overflow-hidden"
          >
            <div className={`w-12 h-12 rounded-[18px] ${item.bg} flex items-center justify-center transition-transform group-hover:scale-105 duration-500 shadow-sm`}>
              <item.icon className={`w-6 h-6 ${item.color}`} />
            </div>
            <div>
              <p className="text-3xl font-black text-slate-900 tracking-tighter tabular-nums leading-none mb-0.5">{item.value}</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{item.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="students" className="w-full">
        <TabsList className="bg-slate-100/40 p-1 rounded-[16px] h-12 mb-8 w-full sm:w-auto flex overflow-x-auto no-scrollbar">
          <TabsTrigger value="students" className="flex-1 sm:flex-none rounded-[12px] px-4 sm:px-8 h-full font-black text-[10px] tracking-widest uppercase data-[state=active]:bg-white data-[state=active]:text-[#8424bd] data-[state=active]:shadow-sm transition-all duration-300">
            Student Register
          </TabsTrigger>
          <TabsTrigger value="attendance" className="flex-1 sm:flex-none rounded-[12px] px-4 sm:px-8 h-full font-black text-[10px] tracking-widest uppercase data-[state=active]:bg-white data-[state=active]:text-[#8424bd] data-[state=active]:shadow-sm transition-all duration-300">
            Daily Activity
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="students" className="mt-0 focus-visible:outline-none">
          <div className="bg-white rounded-[40px] border border-slate-50 shadow-2xl shadow-slate-200/50 overflow-hidden">
            <StudentList />
          </div>
        </TabsContent>
        
        <TabsContent value="attendance" className="mt-0 focus-visible:outline-none">
          <div className="bg-white rounded-[40px] border border-slate-50 shadow-2xl shadow-slate-200/50 p-8">
             <div className="space-y-4">
               {records.length > 0 ? (
                 records.map((record, i) => (
                   <motion.div 
                     key={record._id}
                     initial={{ opacity: 0, x: -20 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ delay: i * 0.05 }}
                     className="flex items-center justify-between p-6 rounded-[28px] border border-slate-50 hover:bg-slate-50 transition-all duration-300 group"
                   >
                     <div className="flex items-center gap-5">
                       <div className={cn(
                         "w-12 h-12 rounded-[18px] flex items-center justify-center transition-transform group-hover:scale-110",
                         record.status === 'You Can Enter' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                       )}>
                         <ShieldCheck className="w-6 h-6" />
                       </div>
                       <div>
                         <p className="font-extrabold text-slate-900 text-lg tracking-tight">{record.student_name}</p>
                         <div className="flex items-center gap-2 mt-0.5">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{record.roll_number}</span>
                           <span className="w-1 h-1 rounded-full bg-slate-200" />
                           <span className="text-[10px] font-bold text-slate-400 uppercase">{new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                         </div>
                       </div>
                     </div>
                     <div className={cn(
                       "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm",
                       record.status === 'You Can Enter' ? "bg-emerald-500 text-white shadow-emerald-100" : "bg-red-500 text-white shadow-red-100"
                     )}>
                       {record.status === 'You Can Enter' ? 'AUTHORIZED' : 'DENIED'}
                     </div>
                   </motion.div>
                 ))
               ) : (
                 <div className="py-24 text-center">
                   <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-6">
                     <Users className="w-10 h-10 text-slate-200" />
                   </div>
                   <p className="text-slate-400 font-black tracking-widest uppercase text-xs">No activity recorded for today</p>
                 </div>
               )}
             </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
