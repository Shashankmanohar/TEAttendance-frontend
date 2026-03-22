import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWeekend, getDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Check, X, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface AttendanceRecord {
  date: string;
  checkIn?: string;
  checkOut?: string;
  timestamp?: string;
  status: string;
}

interface AttendanceCalendarProps {
  records: AttendanceRecord[];
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  title?: string;
}

export default function AttendanceCalendar({ records, currentDate, setCurrentDate, title = "Attendance Overview" }: AttendanceCalendarProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  const startDay = getDay(monthStart);
  const blanks = Array(startDay).fill(null);
  
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const getDayRecord = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return records.find(r => r.date === dateStr);
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-2xl font-black text-slate-900">{format(currentDate, 'MMMM yyyy')}</h3>
          <p className="text-xs font-black text-[#8424bd] uppercase tracking-widest mt-1">{title}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-600 transition-all active:scale-90">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={nextMonth} className="p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-600 transition-all active:scale-90">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 md:gap-3">
        {dayNames.map(day => (
          <div key={day} className="text-center pb-4">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{day}</span>
          </div>
        ))}
        
        {blanks.map((_, i) => (
          <div key={`blank-${i}`} className="aspect-square bg-slate-50/30 rounded-2xl" />
        ))}
        
        {daysInMonth.map((day, i) => {
          const record = getDayRecord(day);
          const isToday = isSameDay(day, new Date());
          const isOff = isWeekend(day);
          
          // Determine status for styling
          // For students status is "You Can Enter" or "Access Denied"
          // For staff status is "Present"
          const isPresent = record && (
            record.status === 'Present' || 
            record.status === 'You Can Enter' || 
            record.status === 'Access Denied but welcomed'
          );

          return (
            <motion.div 
              key={i}
              whileHover={{ scale: 0.98 }}
              className={cn(
                "aspect-square relative rounded-[18px] md:rounded-[24px] overflow-hidden border border-transparent transition-all p-1.5 md:p-3 flex flex-col justify-between",
                isToday ? "bg-white ring-2 ring-[#8424bd] ring-offset-2 z-10" : "bg-slate-50/80 hover:bg-slate-100/80",
                record ? "bg-white border-slate-100 shadow-sm shadow-[#8424bd]/5" : ""
              )}
            >
              <div className="flex justify-between items-start">
                <span className={cn(
                  "text-xs md:text-sm font-black",
                  isToday ? "text-[#8424bd]" : "text-slate-500",
                  isOff && !record ? "text-slate-300" : ""
                )}>
                  {format(day, 'd')}
                </span>
                {isPresent && (
                  <div className={cn(
                    "w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-100"
                  )} />
                )}
              </div>
              
              <div className="mt-auto">
                {record && (
                   <div className="hidden md:flex flex-col gap-1">
                      <div className="flex items-center gap-1 text-[8px] font-bold text-slate-400 uppercase tracking-tight">
                        <Clock className="w-2 h-2" />
                        {record.checkIn ? format(new Date(record.checkIn), 'hh:mm') : 
                         record.timestamp ? format(new Date(record.timestamp), 'hh:mm') : '--:--'}
                      </div>
                      <div className="h-0.5 w-full bg-emerald-500/20 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-emerald-500" 
                          initial={{ width: 0 }}
                          animate={{ width: isPresent ? '100%' : '50%' }}
                        />
                      </div>
                   </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
      
      <div className="flex flex-wrap gap-6 pt-6 border-t border-slate-50">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Present</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-400" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Partial / Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-rose-500" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Absent</span>
        </div>
      </div>
    </div>
  );
}
