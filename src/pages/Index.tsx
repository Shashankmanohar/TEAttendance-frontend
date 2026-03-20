import { useState, useEffect } from 'react';
import { QRScanStep } from '@/components/QRScanStep';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, ArrowRight, ShieldCheck } from 'lucide-react';
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
    
    // Auto-hide splash after 3 seconds
    setTimeout(() => {
      setShowSplash(false);
    }, 3000);

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
    <div className="page-container flex flex-col items-center justify-center min-h-[calc(100vh-140px)]">
      <AnimatePresence mode="wait">
        {!isMarkingStarted ? (
          <motion.div
            key="start-screen"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center w-full max-w-xl text-center"
          >
            <div className="mb-8 relative">
              <div className="absolute inset-0 bg-[#8424bd]/20 blur-3xl rounded-full" />
              <div className="relative w-24 h-24 bg-white rounded-[32px] shadow-2xl flex items-center justify-center border border-purple-100 mb-6 mx-auto">
                <QrCode className="w-12 h-12 text-[#8424bd]" />
              </div>
              <h1 className="text-5xl font-black text-slate-900 tracking-tight mb-4">
                ATTENDANCE <span className="text-[#8424bd]">SYSTEM</span>
              </h1>
              <p className="text-slate-500 text-lg font-medium max-w-md mx-auto">
                Secure and automated attendance marking using encrypted student QR codes.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full mb-10">
              <div className="bg-white/50 border border-slate-100 p-4 rounded-3xl flex items-start gap-3 text-left">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Secure Scan</h3>
                  <p className="text-xs text-slate-500">Instant verification of student credentials</p>
                </div>
              </div>
              <div className="bg-white/50 border border-slate-100 p-4 rounded-3xl flex items-start gap-3 text-left">
                <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                  <div className="w-2 h-2 rounded-full bg-[#8424bd] animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Real-time</h3>
                  <p className="text-xs text-slate-500">Live logs and database synchronization</p>
                </div>
              </div>
            </div>

            <Button 
              size="lg"
              onClick={handleStartMarking}
              className="h-16 px-10 rounded-full bg-slate-900 hover:bg-[#8424bd] transition-all duration-300 shadow-xl shadow-slate-200 hover:shadow-purple-200 group relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2 text-lg font-bold">
                Start Marking Attendance
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Button>
          </motion.div>
        ) : showSplash ? (
          <motion.div
            key="splash-screen"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="fixed inset-0 z-50 bg-[#0a0a0a] flex flex-col items-center justify-center"
          >
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center"
            >
              <img 
                src="/Webfloralogo.webp" 
                alt="Webflora Logo" 
                className="w-[450px] h-auto mb-10 drop-shadow-2xl"
              />
              <div className="flex items-center gap-4">
                <div className="w-2.5 h-2.5 rounded-full bg-[#8424bd] animate-bounce [animation-delay:-0.3s]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#8424bd] animate-bounce [animation-delay:-0.15s]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#8424bd] animate-bounce" />
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="scan-screen"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center w-full max-w-xl text-center"
          >
            <div className="text-center mb-10 w-full">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-full text-[#8424bd] text-xs font-bold uppercase tracking-wider mb-4 border border-purple-100">
                <div className="w-1.5 h-1.5 rounded-full bg-[#8424bd] animate-pulse" />
                System Active
              </div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-2">SCAN STUDENT QR</h2>
              <p className="text-slate-500 font-medium text-lg">Position the QR code within the frame to mark attendance</p>
            </div>
            
            <div className="w-full flex flex-col items-center">
              <QRScanStep />
              
              <Button 
                variant="ghost" 
                onClick={handleCancel}
                className="mt-8 text-slate-400 hover:text-slate-600 font-medium"
              >
                Cancel and Return
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
