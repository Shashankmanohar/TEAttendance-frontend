import { useState, useEffect } from 'react';
import { QRScanStep } from '@/components/QRScanStep';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, ArrowRight, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index = () => {
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
    setIsMarkingStarted(true);
    setShowSplash(true);
    
    // Auto-hide splash after 2.5 seconds for a snappier feel
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
    <div className="page-container flex flex-col items-center justify-center min-h-[calc(100vh-140px)] relative overflow-hidden">
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
            className="flex flex-col items-center w-full max-w-2xl text-center relative z-10"
          >
            <div className="mb-12 relative animate-float">
              <div className="absolute inset-0 bg-[#8424bd]/30 blur-[80px] rounded-full scale-150" />
              <div className="relative w-32 h-32 bg-white rounded-[40px] shadow-2xl flex items-center justify-center border border-purple-50 mb-8 mx-auto group hover:scale-110 transition-transform duration-500">
                <QrCode className="w-16 h-16 text-[#8424bd] group-hover:rotate-12 transition-transform duration-500" />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-500 rounded-2xl flex items-center justify-center border-4 border-white shadow-lg">
                  <ShieldCheck className="w-4 h-4 text-white" />
                </div>
              </div>
              <h1 className="text-6xl font-black text-slate-900 tracking-tight mb-6 leading-[1.1]">
                SMART <span className="text-[#8424bd]">ATTENDANCE</span>
              </h1>
              <p className="text-slate-500 text-xl font-medium max-w-lg mx-auto leading-relaxed">
                Experience the next generation of campus security with our premium QR-based verification system.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-12">
              <div className="bg-white/60 backdrop-blur-xl border border-white p-6 rounded-[32px] flex items-start gap-4 text-left shadow-xl shadow-slate-200/40 hover:shadow-purple-100 transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center shrink-0 shadow-lg">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 mb-1">SECURE PROTOCOL</h3>
                  <p className="text-sm text-slate-500 font-medium">End-to-end encrypted validation for every student scan.</p>
                </div>
              </div>
              <div className="bg-white/60 backdrop-blur-xl border border-white p-6 rounded-[32px] flex items-start gap-4 text-left shadow-xl shadow-slate-200/40 hover:shadow-purple-100 transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl bg-[#8424bd] flex items-center justify-center shrink-0 shadow-lg shadow-purple-200">
                  <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#8424bd] mb-1">LIVE SYNCHRONY</h3>
                  <p className="text-sm text-slate-500 font-medium">Real-time database updates and instant parent notifications.</p>
                </div>
              </div>
            </div>

            <Button 
              size="lg"
              onClick={handleStartMarking}
              className="h-20 px-12 rounded-[24px] bg-slate-900 hover:bg-[#8424bd] text-white transition-all duration-500 shadow-2xl shadow-slate-300 hover:shadow-purple-300 group relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-3 text-xl font-black italic tracking-tight">
                INITIALIZE SCANNER
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-500" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </Button>
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

export default Index;
