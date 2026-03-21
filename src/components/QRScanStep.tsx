import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, XCircle, RefreshCw, Camera, ArrowUpRight, User, CheckCircle2 } from 'lucide-react';
import { markAttendance, MarkAttendanceResult } from '@/lib/attendanceStore';
import { useCameraDevices } from '@/hooks/useCameraDevices';
import { CameraSelector } from './CameraSelector';
import { StudentCard } from './StudentCard';
import { Button } from '@/components/ui/button';
import { useQRFromVideo } from '@/hooks/useQRFromVideo';

export function QRScanStep() {
  const { devices, qrCameraId, setQrCameraId, error: deviceError, refresh } = useCameraDevices();
  const [scanResult, setScanResult] = useState<MarkAttendanceResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Cooldown tracking
  const studentCooldowns = useRef<Map<string, number>>(new Map());
  const globalCooldownRef = useRef<boolean>(false);
  const mountedRef = useRef(true);

  const { detectedPayload, reset: resetQR } = useQRFromVideo({
    videoRef,
    enabled: isScanning && !globalCooldownRef.current,
    intervalMs: 40 // Faster scanning (25 FPS)
  });

  const handleMarkAttendance = useCallback(async (payload: any) => {
    const studentId = payload.studentId || payload.rollNumber || payload.roll_number;
    const now = Date.now();
    
    // 1. Per-student cooldown (3 seconds)
    const lastScanTime = studentCooldowns.current.get(studentId) || 0;
    if (now - lastScanTime < 3000) {
      console.log(`Student ${studentId} is on cooldown`);
      resetQR();
      return;
    }

    // 2. Global UI cooldown (400ms) to prevent overlapping animations/requests
    if (globalCooldownRef.current) return;
    
    globalCooldownRef.current = true;
    studentCooldowns.current.set(studentId, now);

    try {
      const result = await markAttendance(payload);
      setScanResult(result);
      
      // Auto-reset UI after 2.5 seconds
      setTimeout(() => {
        if (!mountedRef.current) return;
        setScanResult(null);
      }, 2500);

      // Allow NEXT scan (global cooldown release) earlier (600ms)
      setTimeout(() => {
        globalCooldownRef.current = false;
        resetQR(); 
      }, 600);

    } catch (error: any) {
      console.error('Attendance error:', error);
      globalCooldownRef.current = false;
      resetQR();
    }
  }, [resetQR]);

  // Effect to trigger attendance marking when payload detected
  useEffect(() => {
    if (detectedPayload) {
      handleMarkAttendance(detectedPayload);
    }
  }, [detectedPayload, handleMarkAttendance]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  }, []);

  const startCamera = useCallback(async () => {
    if (!qrCameraId || !mountedRef.current) return;
    stopCamera();

    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: qrCameraId } }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsScanning(true);
      }
    } catch (error: any) {
      console.error('QR Camera error:', error);
      if (mountedRef.current) {
        setCameraError(error?.message || 'Failed to access QR camera');
        setIsScanning(false);
      }
    }
  }, [qrCameraId, stopCamera]);

  useEffect(() => {
    mountedRef.current = true;
    if (qrCameraId) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => { 
      mountedRef.current = false;
      stopCamera(); 
    };
  }, [qrCameraId, startCamera, stopCamera]);

  return (
    <div className="w-full max-w-lg mx-auto bg-white/40 backdrop-blur-3xl rounded-[48px] shadow-2xl overflow-hidden border border-white p-8 flex flex-col items-center gap-8 relative animate-in fade-in zoom-in duration-700">
      {/* Top Section: Placeholders or Active Info */}
      <div className="w-full flex justify-between items-center text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
        <div className="px-5 py-3 bg-white/60 rounded-[20px] border border-white flex items-center gap-2.5 shadow-sm">
          ROLL ID : <span className="text-slate-900 font-black">{scanResult ? scanResult.student.roll_number : '-------'}</span>
        </div>
        <div className="px-5 py-3 bg-white/60 rounded-[20px] border border-white flex items-center gap-2.5 shadow-sm">
          VALIDITY : <span className="text-[#8424bd] font-black">{scanResult ? (new Date(scanResult.student.valid_until || '').toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })) : '--/--/--'}</span>
        </div>
      </div>

      {/* Profile/Scanner Area */}
      <div className="relative group">
        <div className="absolute inset-0 bg-[#8424bd]/20 blur-[60px] rounded-full scale-110 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        <div className="w-72 h-72 rounded-full overflow-hidden border-[12px] border-white shadow-2xl bg-slate-950 flex items-center justify-center relative qr-scanner-container shrink-0 z-10">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover scale-[1.3] brightness-110 contrast-110"
          />
          
          <AnimatePresence>
            {isScanning && !scanResult && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 pointer-events-none z-10"
              >
                <div className="scan-line-circular w-full opacity-60" />
                <div className="absolute inset-0 border-[20px] border-white/5 rounded-full" />
                <div className="absolute inset-0 border border-white/20 rounded-full" />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {scanResult && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0, filter: 'blur(10px)' }}
                animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                exit={{ scale: 1.1, opacity: 0, filter: 'blur(10px)' }}
                transition={{ type: "spring", damping: 20, stiffness: 100 }}
                className="absolute inset-0 z-20 bg-slate-900"
              >
                {scanResult.student.photo_url ? (
                  <img 
                    src={scanResult.student.photo_url} 
                    alt={scanResult.student.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-500">
                    <User className="w-24 h-24" />
                  </div>
                )}
                
                {/* Overlay status icon */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[4px]">
                   <motion.div
                     initial={{ scale: 0, rotate: -45 }}
                     animate={{ scale: 1, rotate: 0 }}
                     transition={{ type: "spring", damping: 15, stiffness: 150 }}
                     className={`p-6 rounded-[32px] ${scanResult.canEnter ? 'bg-emerald-500' : 'bg-red-500'} shadow-[0_0_50px_rgba(0,0,0,0.3)] border-4 border-white/20`}
                   >
                     {scanResult.canEnter ? (
                       <CheckCircle2 className="w-16 h-16 text-white" />
                     ) : (
                       <XCircle className="w-16 h-16 text-white" />
                     )}
                   </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!scanResult && isScanning && (
            <div className="absolute inset-0 pointer-events-none z-0">
              <div className="absolute inset-0 border-4 border-[#8424bd]/20 rounded-full animate-pulse" />
            </div>
          )}
        </div>
        
        {/* Floating Corners */}
        <div className="absolute -top-4 -left-4 w-12 h-12 border-t-4 border-l-4 border-[#8424bd]/40 rounded-tl-3xl z-20 animate-pulse" />
        <div className="absolute -top-4 -right-4 w-12 h-12 border-t-4 border-r-4 border-[#8424bd]/40 rounded-tr-3xl z-20 animate-pulse" />
        <div className="absolute -bottom-4 -left-4 w-12 h-12 border-b-4 border-l-4 border-[#8424bd]/40 rounded-bl-3xl z-20 animate-pulse" />
        <div className="absolute -bottom-4 -right-4 w-12 h-12 border-b-4 border-r-4 border-[#8424bd]/40 rounded-br-3xl z-20 animate-pulse" />
      </div>

      {/* Welcome Section */}
      <div className="w-full px-8 py-6 bg-white/60 backdrop-blur-xl rounded-[32px] border border-white flex justify-between items-center shadow-xl shadow-slate-200/40 group hover:-translate-y-1 transition-all duration-500">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1.5">
            {scanResult ? 'PROTOCOL RECOGNIZED' : 'STANDBY MODE'}
          </p>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight truncate max-w-[220px]">
            {scanResult ? scanResult.student.name : 'TEAM EXCELLENT'}
          </h2>
        </div>
        <div className={`w-12 h-12 rounded-[20px] flex items-center justify-center transition-all duration-500 shadow-lg ${scanResult ? (scanResult.canEnter ? 'bg-emerald-500 text-white shadow-emerald-200 rotate-45' : 'bg-red-500 text-white shadow-red-200') : 'bg-white text-slate-200 border border-slate-100 group-hover:text-[#8424bd]'}`}>
          <ArrowUpRight className="w-6 h-6" />
        </div>
      </div>

      {/* Footer Status Card */}
      <div className={`w-full p-8 rounded-[44px] transition-all duration-1000 shadow-2xl ${!scanResult ? 'bg-[#0f172a]' : scanResult.canEnter ? 'bg-[#8424bd]' : 'bg-red-600'} text-white flex flex-col gap-5 relative overflow-hidden group/card`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover/card:scale-150 transition-transform duration-1000" />
        
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-6">
            <div className={`w-16 h-16 rounded-[24px] bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-black text-2xl tracking-tighter transition-all duration-500 ${scanResult ? 'scale-110 rotate-3 shadow-xl' : ''}`}>
              {scanResult ? scanResult.student.name.split(' ').map(n => n[0]).join('') : '??'}
            </div>
            <div>
              <h3 className="font-black text-2xl leading-none mb-2 tracking-tight">
                {scanResult ? (scanResult.canEnter ? 'ACCESS GRANTED' : 'ACCESS DENIED') : 'READY TO SCAN'}
              </h3>
              <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] inline-block bg-white/10 border border-white/20 backdrop-blur-sm`}>
                {scanResult ? scanResult.message : 'Position QR for Detection'}
              </div>
            </div>
          </div>
          <div className="relative">
             <QrCode className={`w-8 h-8 ${isScanning && !scanResult ? 'animate-pulse text-emerald-400' : 'text-white'}`} />
             {scanResult && <div className="absolute inset-0 bg-white blur-xl opacity-30 animate-pulse" />}
          </div>
        </div>
        
        <div className="pt-5 border-t border-white/10">
          <p className="text-[11px] text-white/60 italic font-medium leading-relaxed uppercase tracking-wider">
            {scanResult ? 
              (scanResult.canEnter ? '"EXCELLENCE IS NOT A SKILL. IT IS AN ATTITUDE."' : '"AUTHORIZATION FAILED. CONTACT SYSTEM ADMIN."') 
              : '"PROCEED WITH CAUTION. SYSTEM IS RECORDING."'}
          </p>
        </div>
      </div>

      {cameraError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/98 backdrop-blur-md p-8 z-[60] rounded-[48px] animate-in slide-in-from-top-4 duration-500">
          <div className="w-20 h-20 rounded-[32px] bg-red-50 flex items-center justify-center mb-6">
            <XCircle className="w-10 h-10 text-red-500" />
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2">HARDWARE ERROR</h3>
          <p className="text-center font-bold text-slate-400 text-sm mb-8 leading-relaxed max-w-[240px]">{cameraError}</p>
          <Button onClick={startCamera} className="w-full h-16 rounded-[24px] bg-[#8424bd] hover:bg-[#6c1d9b] text-white font-black tracking-widest text-xs shadow-xl active:scale-95 transition-all">
            <RefreshCw className="w-4 h-4 mr-3 animate-spin-slow" />
            RE-INITIALIZE HARDWARE
          </Button>
        </div>
      )}
    </div>
  );
}
