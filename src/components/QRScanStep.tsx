import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, XCircle, RefreshCw, Camera, ArrowUpRight, User } from 'lucide-react';
import { markAttendance, MarkAttendanceResult } from '@/lib/attendanceStore';
import { useCameraDevices } from '@/hooks/useCameraDevices';
import { CameraSelector } from './CameraSelector';
import { StudentCard } from './StudentCard';
import { Button } from '@/components/ui/button';

export function QRScanStep() {
  const { devices, qrCameraId, setQrCameraId, error: deviceError, refresh } = useCameraDevices();
  const [scanResult, setScanResult] = useState<MarkAttendanceResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScannedRef = useRef<string | null>(null);
  const cooldownRef = useRef<boolean>(false);
  const containerIdRef = useRef(`qr-reader-${Math.random().toString(36).slice(2, 8)}`);
  const mountedRef = useRef(true);

  const handleScan = useCallback(
    async (decodedText: string) => {
      if (cooldownRef.current || decodedText === lastScannedRef.current) return;

      cooldownRef.current = true;
      lastScannedRef.current = decodedText;

      try {
        const payload = JSON.parse(decodedText);
        const result = await markAttendance(payload);
        setScanResult(result);
        
        // Keep the result visible for 5 seconds then reset
        setTimeout(() => {
          if (!mountedRef.current) return;
          setScanResult(null);
          lastScannedRef.current = null;
          cooldownRef.current = false;
        }, 5000);
      } catch (error: any) {
        console.error('Attendance error:', error);
        // On error, reset faster to allow retry
        setTimeout(() => {
          if (!mountedRef.current) return;
          lastScannedRef.current = null;
          cooldownRef.current = false;
        }, 2000);
      }
    },
    []
  );

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (e) {
        console.warn('Scanner stop/clear error:', e);
      } finally {
        scannerRef.current = null;
      }
    }
    setIsScanning(false);
  }, []);

  const startScanner = useCallback(async () => {
    if (!qrCameraId || !mountedRef.current) return;
    await stopScanner();
    if (!mountedRef.current) return;

    try {
      setCameraError(null);
      const scanner = new Html5Qrcode(containerIdRef.current);
      scannerRef.current = scanner;

      await scanner.start(
        { deviceId: { exact: qrCameraId } },
        { 
          fps: 20, 
          // qrbox: { width: 250, height: 250 },
          aspectRatio: undefined, 
          disableFlip: false 
        },
        handleScan,
        () => {}
      );
      if (mountedRef.current) {
        setIsScanning(true);
      } else {
        await stopScanner();
      }
    } catch (error: any) {
      console.error('QR Camera error:', error);
      if (mountedRef.current) {
        setCameraError(error?.message || 'Failed to access QR camera');
        setIsScanning(false);
      }
    }
  }, [qrCameraId, handleScan, stopScanner]);

  useEffect(() => {
    mountedRef.current = true;
    if (qrCameraId) {
      startScanner();
    } else {
      stopScanner();
    }
    return () => { 
      mountedRef.current = false;
      stopScanner(); 
    };
  }, [qrCameraId, startScanner, stopScanner]);

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-[48px] shadow-2xl overflow-hidden border border-gray-100 p-8 flex flex-col items-center gap-6 relative animate-in fade-in zoom-in duration-500">
      {/* Top Section: Placeholders or Active Info */}
      <div className="w-full flex justify-between items-center text-[10px] font-bold tracking-widest text-gray-400 uppercase">
        <div className="px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-100">
          ROLL : {scanResult ? scanResult.student.roll_number : '-------'}
        </div>
        <div className="px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-100">
          VALID : {scanResult ? (new Date(scanResult.student.valid_until || '').toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })) : '--/--/--'}
        </div>
      </div>

      {/* Profile/Scanner Area */}
      <div className="relative">
        <div className="w-64 h-64 rounded-full overflow-hidden border-8 border-emerald-50 shadow-2xl bg-slate-900 flex items-center justify-center relative qr-scanner-container shrink-0">
          <div
            id={containerIdRef.current}
            className="w-full h-full [&_video]:object-cover [&_video]:min-h-full [&_video]:min-w-full [&_video]:scale-[1.2]"
          />
          
          <AnimatePresence>
            {isScanning && !scanResult && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 pointer-events-none"
              >
                <div className="scan-line-circular w-64" />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {scanResult && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute inset-0 z-20"
              >
                {scanResult.student.photo_url ? (
                  <img 
                    src={scanResult.student.photo_url} 
                    alt={scanResult.student.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-64 h-64 bg-slate-100 flex items-center justify-center text-slate-300">
                    <User className="w-24 h-24" />
                  </div>
                )}
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
      <div className="w-full px-7 py-5 bg-gray-50 rounded-[28px] border border-slate-100 flex justify-between items-center">
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">WELCOME TO</p>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">TEAM EXCELLENT</h2>
        </div>
        <ArrowUpRight className="text-gray-300 w-7 h-7" />
      </div>

      {/* Footer Status Card */}
      <div className={`w-full p-6 rounded-[36px] transition-colors duration-500 ${!scanResult ? 'bg-[#0f172a]' : scanResult.canEnter ? 'bg-[#8424bd]' : 'bg-red-600'} text-white flex flex-col gap-4 shadow-xl`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center font-bold text-xl">
              {scanResult ? scanResult.student.name.split(' ').map(n => n[0]).join('') : '??'}
            </div>
            <div>
              <h3 className="font-bold text-xl leading-tight">
                {scanResult ? scanResult.student.name : 'Ready to Scan'}
              </h3>
              <div className={`mt-1.5 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block bg-white/10 border border-white/20`}>
                {scanResult ? scanResult.message : 'Position QR in Frame'}
              </div>
            </div>
          </div>
          <QrCode className={`w-7 h-7 ${isScanning ? 'animate-pulse text-emerald-400' : 'text-white/40'}`} />
        </div>
        
        <p className="text-xs text-white/50 italic font-medium leading-relaxed">
          {scanResult ? '"Consistency beats talent when talent doesn\'t work hard."' : '"Please wait while the system verifies credentials."'}
        </p>
      </div>

      {cameraError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm p-6 z-50 rounded-[40px]">
          <XCircle className="w-12 h-12 text-red-500 mb-4" />
          <p className="text-center font-bold text-slate-900 mb-4">{cameraError}</p>
          <Button onClick={startScanner} variant="outline" className="rounded-2xl h-12 px-8 font-black border-slate-200">
            <RefreshCw className="w-4 h-4 mr-2" />
            RETRY CAMERA
          </Button>
        </div>
      )}
    </div>
  );
}
