import { useState, useEffect, useCallback } from 'react';
import { Users, UserCheck, UserX, RefreshCw, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StudentList } from './StudentList';
import { getAttendanceRecords, getTodayDateKey, getStudents } from '@/lib/attendanceStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function StudentManagement() {
  const [stats, setStats] = useState({ totalStrength: 0, present: 0, absent: 0 });
  const [batchCount, setBatchCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // For now, we'll keep stats simplified or fetch from backend soon
  // Let's assume stats come from attendance records of today
  const refreshStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const [records, students] = await Promise.all([
        getAttendanceRecords(getTodayDateKey()),
        getStudents()
      ]);
      
      const presentCount = records.filter(r => r.status === 'You Can Enter').length;
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
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">ADMIN PANEL</h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">Management Console</p>
        </div>
        <Button variant="outline" size="icon" onClick={refreshStats} disabled={isLoading} className="h-11 w-11 rounded-2xl shadow-sm">
          <RefreshCw className={`w-4 h-4 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-xl flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center">
            <Users className="w-7 h-7 text-indigo-600" />
          </div>
          <div>
            <p className="text-3xl font-black text-slate-900">{stats.totalStrength}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Students</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-xl flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center">
            <UserCheck className="w-7 h-7 text-emerald-600" />
          </div>
          <div>
            <p className="text-3xl font-black text-emerald-600">{stats.present}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Present Today</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-xl flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center">
            <ShieldCheck className="w-7 h-7 text-amber-600" />
          </div>
          <div>
            <p className="text-3xl font-black text-slate-900">{batchCount}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Batches</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="students" className="w-full">
        <TabsList className="bg-slate-100/50 p-1 rounded-2xl h-14 mb-6">
          <TabsTrigger value="students" className="rounded-xl px-8 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">STUDENTS LIST</TabsTrigger>
          <TabsTrigger value="attendance" className="rounded-xl px-8 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">ATTENDANCE LOGS</TabsTrigger>
        </TabsList>
        <TabsContent value="students" className="mt-0">
          <StudentList />
        </TabsContent>
        <TabsContent value="attendance" className="mt-0">
          <div className="bg-white p-12 rounded-[32px] border border-slate-100 shadow-xl text-center">
            <p className="text-slate-400 font-medium">Detailed logs window is coming soon...</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
