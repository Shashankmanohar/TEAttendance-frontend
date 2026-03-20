import { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, Image as ImageIcon, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { getAttendanceRecords, AttendanceRecord, getTodayDateKey } from '@/lib/attendanceStore';

export function AttendanceLogs() {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState(getTodayDateKey());
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const today = getTodayDateKey();

  const loadRecords = useCallback(async () => {
    try {
      const data = await getAttendanceRecords();
      setRecords(data);
    } catch (error) {
      console.error('Error loading records:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecords();
    const interval = setInterval(loadRecords, 10000);
    return () => clearInterval(interval);
  }, [loadRecords]);

  const filteredRecords = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return records.filter((r) => {
      const matchesSearch = !q || 
        r.student_name.toLowerCase().includes(q) || 
        r.course.toLowerCase().includes(q) || 
        r.roll_number.toLowerCase().includes(q);
      const matchesDate = !dateFilter || r.date === dateFilter;
      return matchesSearch && matchesDate;
    });
  }, [records, searchQuery, dateFilter]);

  const formatTime = (ts: string) =>
    new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">ATTENDANCE LOGS</h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Real-time Activity Stream</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by name, course, or roll..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 rounded-2xl border-slate-100 shadow-sm"
            />
          </div>
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="h-12 w-full sm:w-44 rounded-2xl border-slate-100 shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student info</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Roll Number</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Course</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Time & Date</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <p className="text-slate-400 font-medium">{isLoading ? 'Loading logs...' : 'No activity found for this period.'}</p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record._id} className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400 text-xs">
                          {record.student_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{record.student_name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{record.class_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
                        {record.roll_number}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-500">{record.course}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {formatTime(record.timestamp)}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                          <CalendarIcon className="w-3 h-3" />
                          {formatDate(record.date)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        record.status === 'You Can Enter' 
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                          : 'bg-red-50 text-red-600 border border-red-100'
                      }`}>
                        {record.status}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
