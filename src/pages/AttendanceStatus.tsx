import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, CheckCircle2, QrCode, ShieldCheck, Sparkles, GraduationCap } from 'lucide-react';
import { getLatestAttendance, LatestAttendanceResult } from '@/lib/attendanceStore';

const IDLE_RESET_TIMEOUT = 5000; // 5 seconds to show welcome screen
const POLLING_INTERVAL = 1000; // 1 second

export default function AttendanceStatus() {
  const [latestRecord, setLatestRecord] = useState<LatestAttendanceResult | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const lastRecordId = useRef<string | null>(null);
  const resetTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const poll = async () => {
      try {
        const record = await getLatestAttendance();
        if (record && record._id !== lastRecordId.current) {
          lastRecordId.current = record._id;
          setLatestRecord(record);
          setShowWelcome(true);
          
          // Reset timer
          if (resetTimer.current) clearTimeout(resetTimer.current);
          resetTimer.current = setTimeout(() => {
            setShowWelcome(false);
          }, IDLE_RESET_TIMEOUT);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    const interval = setInterval(poll, POLLING_INTERVAL);
    return () => {
      clearInterval(interval);
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-[#8424bd]/10 rounded-full blur-[150px] animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[800px] h-[800px] bg-[#3b82f6]/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />

      <AnimatePresence mode="wait">
        {!showWelcome ? (
          <motion.div
            key="idle"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="text-center z-10"
          >
            <div className="w-32 h-32 rounded-[40px] bg-white/5 border border-white/10 flex items-center justify-center mb-10 mx-auto group">
              <QrCode className="w-16 h-16 text-white/20 group-hover:text-[#8424bd]/40 transition-colors duration-500" />
            </div>
            <h1 className="text-5xl lg:text-7xl font-black text-white tracking-tighter mb-6">
              READY FOR <span className="text-[#8424bd] uppercase">SCAN</span>
            </h1>
            <p className="text-slate-500 font-bold text-lg uppercase tracking-[0.5em] flex items-center justify-center gap-4">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Please Present Your QR Code
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.2, y: -50 }}
            className="w-full max-w-5xl z-10"
          >
            <div className="bg-white/5 backdrop-blur-3xl rounded-[60px] border border-white/10 shadow-[0_0_100px_rgba(132,36,189,0.15)] overflow-hidden">
              <div className="p-12 lg:p-20 flex flex-col md:flex-row items-center gap-16 lg:gap-24">
                {/* Photo Section */}
                <div className="relative">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 15, delay: 0.2 }}
                    className="relative z-10"
                  >
                    <div className="w-72 h-72 lg:w-96 lg:h-96 rounded-[50px] overflow-hidden border-8 border-white/10 shadow-2xl relative">
                      {latestRecord?.student_photo ? (
                        <img 
                          src={latestRecord.student_photo} 
                          alt={latestRecord.student_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-600">
                          <User className="w-32 h-32" />
                        </div>
                      )}
                      
                      {/* Success Indicator */}
                      <div className="absolute bottom-6 right-6 w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-xl border-4 border-white shadow-emerald-500/40">
                        <CheckCircle2 className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </motion.div>
                  
                  {/* Decorative Rings */}
                  <div className="absolute inset-0 border-2 border-[#8424bd]/30 rounded-[60px] animate-ping opacity-20" style={{ animationDuration: '3s' }} />
                  <div className="absolute inset-[-20px] border border-white/10 rounded-[80px] animate-reverse-spin opacity-10" />
                </div>

                {/* Content Section */}
                <div className="flex-1 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-[0.3em] mb-8">
                    <ShieldCheck className="w-4 h-4" />
                    Verified Entry Approved
                  </div>
                  
                  <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <h2 className="text-3xl lg:text-4xl font-black text-[#8424bd] uppercase tracking-[0.2em] mb-2 drop-shadow-sm">WELCOME</h2>
                    <h1 className="text-6xl lg:text-8xl font-black text-white tracking-tighter mb-8 leading-tight">
                      {latestRecord?.student_name}
                    </h1>
                  </motion.div>

                  <div className="grid grid-cols-2 gap-6 max-w-md">
                    <div className="p-6 rounded-[32px] bg-white/5 border border-white/5 flex flex-col">
                      <span className="text-[10px] font-black text-[#8424bd] uppercase tracking-widest mb-2 flex items-center gap-2">
                        <GraduationCap className="w-3 h-3" /> COURSE
                      </span>
                      <span className="text-xl font-bold text-white uppercase">{latestRecord?.course}</span>
                    </div>
                    <div className="p-6 rounded-[32px] bg-white/5 border border-white/5 flex flex-col">
                      <span className="text-[10px] font-black text-[#8424bd] uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Sparkles className="w-3 h-3" /> ROLL ID
                      </span>
                      <span className="text-xl font-bold text-white uppercase">{latestRecord?.roll_number}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Progress Bar */}
              <motion.div 
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: IDLE_RESET_TIMEOUT / 1000, ease: "linear" }}
                className="h-1.5 bg-[#8424bd]"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-10 left-10 text-white/10 font-black text-xs tracking-[1em] uppercase">
        Team Excellent Monitoring System v1.0
      </div>
    </div>
  );
}
