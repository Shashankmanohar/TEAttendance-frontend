import { useState, useEffect } from 'react';
import { QRScanStep } from '@/components/QRScanStep';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, ArrowRight, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

const AttendanceScanner = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isMarkingStarted, setIsMarkingStarted] = useState(false);
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    const handleFullscreenExit = () => {
      if (!document.fullscreenElement) {
        setIsMarkingStarted(false);
        setShowSplash(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenExit);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenExit);
  }, []);

  const handleStartMarking = async () => {
    if (user?.role !== 'admin') {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "Only administrators can launch the scanner.",
      });
      return;
    }

    setIsMarkingStarted(true);
    setShowSplash(true);
    
    setTimeout(() => {
      setShowSplash(false);
    }, 2500);

    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen request failed:', err);
    }
  };

  const handleCancel = async () => {
    setIsMarkingStarted(false);
    setShowSplash(false);
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn('Exit fullscreen failed:', err);
    }
  };

  return (
    <div className="page-container flex flex-col items-center justify-center min-h-[calc(100vh-140px)] relative overflow-hidden py-12">
      {/* Decorative Background Elements */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-[#8424bd]/10 blur-[120px] rounded-full pointer-events-none" />

      <AnimatePresence mode="wait">
        {!isMarkingStarted ? (
          <motion.div
            key="start-screen"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, filter: 'blur(10px)', scale: 1.1 }}
            transition={{ type: "spring", damping: 25, stiffness: 120 }}
            className="flex flex-col items-center w-full max-w-4xl text-center relative z-10"
          >
            {/* Header Section */}
            <div className="mb-10 text-center">
              <div className="relative w-24 h-24 bg-white rounded-[32px] shadow-2xl flex items-center justify-center border border-purple-50 mb-6 mx-auto group">
                <QrCode className="w-12 h-12 text-[#8424bd]" />
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-xl flex items-center justify-center border-2 border-white shadow-lg">
                  <ShieldCheck className="w-3 h-3 text-white" />
                </div>
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight mb-4 leading-[1.1]">
                ADMIN <span className="text-[#8424bd]">SCANNER</span>
              </h1>
              <p className="text-slate-500 text-base md:text-xl font-medium max-w-lg mx-auto">
                Secure institutional verification terminal for students and staff.
              </p>
            </div>

            {/* Main Interaction Area */}
            <div className="w-full max-w-md bg-white/60 backdrop-blur-xl border border-white p-8 rounded-[36px] shadow-2xl shadow-slate-200/50 mb-8">
              <div className="space-y-6">
                <div className="space-y-1 text-left px-2">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Instant Verification</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">QR Based Smart Attendance</p>
                </div>
                
                <Button 
                  onClick={handleStartMarking}
                  className="w-full h-20 rounded-[28px] bg-slate-900 hover:bg-[#8424bd] text-white transition-all duration-500 shadow-2xl shadow-slate-200 group relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-3 text-lg font-black uppercase tracking-tight italic">
                    INITIALIZE SCANNER
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-500" />
                  </span>
                </Button>
                
                <div className="grid grid-cols-2 gap-3 mt-4">
                   <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-100">
                         <ShieldCheck className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-left">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Encryption</p>
                         <p className="text-[10px] font-bold text-slate-900">1024-BIT</p>
                      </div>
                   </div>
                   <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#8424bd] flex items-center justify-center shadow-lg shadow-purple-100">
                         <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      </div>
                      <div className="text-left">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                         <p className="text-[10px] font-bold text-slate-900 uppercase">Live Feed</p>
                      </div>
                   </div>
                </div>
              </div>
            </div>

            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">Institutional Verification Terminal</p>
          </motion.div>
        ) : showSplash ? (
          <motion.div
            key="splash-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, filter: 'blur(20px)' }}
            className="fixed inset-0 z-[100] bg-[#0c0c0e] flex flex-col items-center justify-center overflow-hidden"
          >
            <div className="absolute inset-0">
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#8424bd]/20 blur-[150px] rounded-full" />
               <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
            </div>
            
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 100 }}
              className="relative z-10 flex flex-col items-center"
            >
              <div className="relative mb-12">
                <div className="absolute inset-0 blur-2xl bg-white/10 rounded-full scale-110" />
                <img 
                  src="/Webfloralogo.webp" 
                  alt="Webflora" 
                  className="w-[380px] h-auto relative z-10 drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                />
              </div>
              <div className="flex flex-col items-center gap-6">
                <div className="h-1 w-64 bg-white/5 rounded-full overflow-hidden relative">
                  <motion.div 
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-[#8424bd] to-transparent w-32"
                  />
                </div>
                <p className="text-white/40 font-black text-[10px] tracking-[0.5em] uppercase">Initializing Secure Matrix</p>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="scan-screen"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 100 }}
            className="flex flex-col items-center w-full max-w-2xl text-center relative z-10"
          >
            <div className="text-center mb-12 w-full">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="inline-flex items-center gap-3 px-6 py-2.5 bg-[#8424bd]/5 backdrop-blur-md rounded-full text-[#8424bd] text-[10px] font-black uppercase tracking-[0.2em] mb-6 border border-[#8424bd]/20 shadow-lg shadow-purple-500/5"
              >
                <div className="w-2 h-2 rounded-full bg-[#8424bd] animate-ping" />
                Scanner Active • High-Speed Tracking
              </motion.div>
              <h2 className="text-5xl font-black text-slate-900 tracking-tight mb-4">READY FOR <span className="text-[#8424bd]">SCAN</span></h2>
              <p className="text-slate-400 font-bold text-lg max-w-md mx-auto">Center the student QR code within the circular frame for instant validation.</p>
            </div>
            
            <div className="w-full flex flex-col items-center">
              <QRScanStep />
              
              <Button 
                variant="ghost" 
                onClick={handleCancel}
                className="mt-12 h-14 px-8 rounded-2xl text-slate-400 hover:text-slate-900 font-black tracking-widest text-[11px] uppercase group transition-all"
              >
                <X className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" />
                Abort Session
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AttendanceScanner;
