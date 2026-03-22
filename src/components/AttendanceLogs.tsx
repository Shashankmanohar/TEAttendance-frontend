import { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, Calendar as CalendarIcon, Clock, Database } from 'lucide-react';
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
      const recordsArray = Array.isArray(data) ? data : (data.history || []);
      setRecords(recordsArray);
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
    new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            ACTIVITY <span className="text-[#8424bd]">STREAM</span>
            <div className="w-2 h-2 rounded-full bg-[#8424bd] animate-pulse" />
          </h2>
          <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-1.5 flex items-center gap-2">
            Verifying Student Credentials in Real-time
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <div className="relative w-full sm:flex-1 lg:min-w-[400px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#8424bd] transition-colors" />
            <Input
              placeholder="Filter by name, course, or roll..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-13 rounded-2xl border-slate-100 bg-white shadow-sm focus:ring-2 focus:ring-purple-100 transition-all font-medium"
            />
          </div>
          <div className="relative w-full sm:w-auto lg:w-48">
            <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="pl-11 h-13 w-full rounded-2xl border-slate-100 bg-white shadow-sm focus:ring-2 focus:ring-purple-100 transition-all font-bold text-xs uppercase"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Student Identifier</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Credentials</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Timeline</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Access Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center gap-4 max-w-sm mx-auto">
                      <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center">
                        <Database className="w-8 h-8 text-slate-200" />
                      </div>
                      <div>
                        <p className="text-slate-900 font-black tracking-tight">{isLoading ? 'Synchronizing Data...' : 'No activity found'}</p>
                        <p className="text-sm text-slate-400 font-medium">Try adjusting your filters or search terms.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record._id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="relative shrink-0">
                          <div className="w-12 h-12 rounded-[18px] bg-white border border-slate-100 shadow-sm flex items-center justify-center font-black text-[#8424bd] text-sm group-hover:scale-110 transition-transform duration-500">
                            {record.student_name.charAt(0)}
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${record.status === 'You Can Enter' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        </div>
                        <div>
                          <p className="font-black text-slate-900 leading-none mb-1.5 group-hover:text-[#8424bd] transition-colors">{record.student_name}</p>
                          <div className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-widest">{record.class_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1.5">
                        <span className="font-mono text-[11px] font-black text-slate-400 tracking-wider">ROLL: {record.roll_number}</span>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                          {record.course}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-xs font-black text-slate-800">
                          <Clock className="w-3.5 h-3.5 text-[#8424bd]" />
                          {formatTime(record.timestamp)}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                          <CalendarIcon className="w-3 h-3" />
                          {formatDate(record.date)}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className={`inline-flex px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${
                        record.status === 'You Can Enter' 
                          ? 'bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white' 
                          : 'bg-red-50 text-red-600 ring-1 ring-inset ring-red-500/20 group-hover:bg-red-500 group-hover:text-white'
                      }`}>
                        {record.status === 'You Can Enter' ? 'Authenticated' : 'Access Denied'}
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
