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
    
    // 1. Per-student cooldown (10 seconds)
    const lastScanTime = studentCooldowns.current.get(studentId) || 0;
    if (now - lastScanTime < 10000) {
      console.log(`Student ${studentId} is on cooldown`);
      resetQR();
      return;
    }

    // 2. Global UI cooldown (800ms) to prevent overlapping animations/requests
    if (globalCooldownRef.current) return;
    
    globalCooldownRef.current = true;
    studentCooldowns.current.set(studentId, now);

    try {
      // Clear previous result immediately to show loading/new state if needed
      // but here we just wait for the new result to pop in
      const result = await markAttendance(payload);
      
      // Clear any existing timeout to avoid multiple resets overlapping
      setScanResult(result);
      
      // Auto-reset UI after 4 seconds (but allow next scan after 1.5s)
      setTimeout(() => {
        if (!mountedRef.current) return;
        setScanResult(null);
      }, 4000);

      // Allow NEXT scan (global cooldown release)
      setTimeout(() => {
        globalCooldownRef.current = false;
        resetQR(); // Reset the hook's internal lastRawRef
      }, 1500);

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
    <div className="w-full max-w-md mx-auto bg-white rounded-[48px] shadow-2xl overflow-hidden border border-gray-100 p-8 flex flex-col items-center gap-6 relative animate-in fade-in zoom-in duration-500">
      {/* Top Section: Placeholders or Active Info */}
      <div className="w-full flex justify-between items-center text-[10px] font-bold tracking-widest text-gray-400 uppercase">
        <div className="px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-2">
          ROLL : <span className="text-slate-900">{scanResult ? scanResult.student.roll_number : '-------'}</span>
        </div>
        <div className="px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-2">
          VALID : <span className="text-slate-900">{scanResult ? (new Date(scanResult.student.valid_until || '').toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })) : '--/--/--'}</span>
        </div>
      </div>

      {/* Profile/Scanner Area */}
      <div className="relative">
        <div className="w-64 h-64 rounded-full overflow-hidden border-8 border-emerald-50 shadow-2xl bg-slate-950 flex items-center justify-center relative qr-scanner-container shrink-0">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover scale-[1.2]"
          />
          
          <AnimatePresence>
            {isScanning && !scanResult && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 pointer-events-none z-10"
              >
                <div className="scan-line-circular w-64" />
                <div className="absolute inset-0 border-[16px] border-white/5 rounded-full" />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {scanResult && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.1, opacity: 0 }}
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
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
                   <motion.div
                     initial={{ scale: 0.5, opacity: 0 }}
                     animate={{ scale: 1, opacity: 1 }}
                     className={`p-4 rounded-full ${scanResult.canEnter ? 'bg-emerald-500' : 'bg-red-500'} shadow-2xl`}
                   >
                     {scanResult.canEnter ? (
                       <CheckCircle2 className="w-12 h-12 text-white" />
                     ) : (
                       <XCircle className="w-12 h-12 text-white" />
                     )}
                   </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!scanResult && isScanning && (
            <div className="absolute inset-0 pointer-events-none z-0">
              <div className="absolute inset-0 border-2 border-[#8424bd]/30 rounded-full animate-pulse" />
            </div>
          )}
        </div>
      </div>

      {/* Welcome Section */}
      <div className="w-full px-7 py-5 bg-gray-50 rounded-[28px] border border-slate-100 flex justify-between items-center transition-all duration-300">
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
            {scanResult ? 'STUDENT IDENTIFIED' : 'WELCOME TO'}
          </p>
          <h2 className="text-xl font-black text-slate-900 tracking-tight truncate max-w-[180px]">
            {scanResult ? scanResult.student.name : 'TEAM EXCELLENT'}
          </h2>
        </div>
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${scanResult ? (scanResult.canEnter ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600') : 'bg-white text-gray-300 border border-gray-100'}`}>
          <ArrowUpRight className="w-5 h-5" />
        </div>
      </div>

      {/* Footer Status Card */}
      <div className={`w-full p-6 rounded-[36px] transition-all duration-500 shadow-xl ${!scanResult ? 'bg-[#0f172a]' : scanResult.canEnter ? 'bg-[#8424bd]' : 'bg-red-600'} text-white flex flex-col gap-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl transition-colors ${scanResult ? 'bg-white/20' : 'bg-white/10'}`}>
              {scanResult ? scanResult.student.name.split(' ').map(n => n[0]).join('') : '??'}
            </div>
            <div>
              <h3 className="font-bold text-xl leading-tight">
                {scanResult ? (scanResult.canEnter ? 'Access Granted' : 'Access Denied') : 'Ready to Scan'}
              </h3>
              <div className={`mt-1.5 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block bg-white/10 border border-white/20`}>
                {scanResult ? scanResult.message : 'Position QR in Frame'}
              </div>
            </div>
          </div>
          <QrCode className={`w-7 h-7 ${isScanning && !scanResult ? 'animate-pulse text-emerald-400' : 'text-white/40'}`} />
        </div>
        
        <p className="text-xs text-white/70 italic font-medium leading-relaxed">
          {scanResult ? 
            (scanResult.canEnter ? '"Success is not final; failure is not fatal: It is the courage to continue that counts."' : '"Please resolve outstanding issues to proceed."') 
            : '"Please wait while the system verifies credentials."'}
        </p>
      </div>

      {cameraError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm p-6 z-50 rounded-[40px]">
          <XCircle className="w-12 h-12 text-red-500 mb-4" />
          <p className="text-center font-bold text-slate-900 mb-4">{cameraError}</p>
          <Button onClick={startCamera} variant="outline" className="rounded-2xl h-12 px-8 font-black border-slate-200">
            <RefreshCw className="w-4 h-4 mr-2" />
            RETRY CAMERA
          </Button>
        </div>
      )}
    </div>
  );
}
