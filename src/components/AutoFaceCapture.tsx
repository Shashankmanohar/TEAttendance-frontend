import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useFaceDetection, type FaceStatus } from '@/hooks/useFaceDetection';

interface AutoFaceCaptureProps {
  deviceId: string;
  onCapture: (blob: Blob, dataUrl: string) => void;
  onError: (message: string) => void;
  enabled: boolean;
}

const GUIDANCE: Record<FaceStatus, string> = {
  loading: 'Loading face detection...',
  no_face: 'Step in front of the camera',
  aligning: 'Center your face & look at camera',
  ready: 'Hold still...',
  capturing: 'Capturing...',
  captured: 'Face captured!',
};

const BORDER_COLOR: Record<FaceStatus, string> = {
  loading: 'border-muted-foreground/30',
  no_face: 'border-muted-foreground/40',
  aligning: 'border-warning',
  ready: 'border-success',
  capturing: 'border-success',
  captured: 'border-success',
};

export function AutoFaceCapture({ deviceId, onCapture, onError, enabled }: AutoFaceCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [captured, setCaptured] = useState<string | null>(null);
  const [showFlash, setShowFlash] = useState(false);
  const prevEnabledRef = useRef(enabled);

  const { status, reset: resetDetection } = useFaceDetection({
    videoRef,
    enabled: enabled && isReady && !captured,
  });

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setIsReady(false);
  }, []);

  const startCamera = useCallback(async () => {
    if (!deviceId) return;
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: deviceId },
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsReady(true);
      }
    } catch (err: any) {
      onError(err?.message || 'Failed to access face camera');
    }
  }, [deviceId, onError, stopCamera]);

  // Start camera on mount / device change
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [deviceId]);

  // Auto-capture when face detection says 'capturing'
  useEffect(() => {
    if (status !== 'capturing' || captured) return;

    const video = videoRef.current;
    if (!video) return;

    // Flash effect
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 200);

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
    setCaptured(dataUrl);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          stopCamera();
          onCapture(blob, dataUrl);
        }
      },
      'image/jpeg',
      0.6,
    );
  }, [status, captured, onCapture, stopCamera]);

  // Reset when re-enabled (new student cycle)
  useEffect(() => {
    if (enabled && !prevEnabledRef.current) {
      setCaptured(null);
      setShowFlash(false);
      resetDetection();
      if (!streamRef.current && deviceId) startCamera();
    }
    prevEnabledRef.current = enabled;
  }, [enabled, resetDetection, startCamera, deviceId]);

  const displayStatus: FaceStatus = captured ? 'captured' : status;

  return (
    <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-muted border border-border">
      {captured ? (
        <img src={captured} alt="Captured" className="w-full h-full object-cover" />
      ) : (
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
      )}

      {/* Face guide oval */}
      {!captured && isReady && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className={`w-36 h-48 rounded-[50%] border-[3px] transition-colors duration-300 ${BORDER_COLOR[displayStatus]}`}
            style={{
              boxShadow:
                displayStatus === 'ready'
                  ? '0 0 20px hsl(var(--success) / 0.3)'
                  : 'none',
            }}
          />
        </div>
      )}

      {/* Flash effect */}
      <AnimatePresence>
        {showFlash && (
          <motion.div
            initial={{ opacity: 0.85 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-white z-10"
          />
        )}
      </AnimatePresence>

      {/* Captured badge */}
      {captured && (
        <div className="absolute bottom-2 right-2 bg-success text-success-foreground rounded-full p-1.5">
          <CheckCircle2 className="w-4 h-4" />
        </div>
      )}

      {/* Guidance text */}
      {!captured && isReady && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-2">
          {status === 'loading' && (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
          )}
          {status === 'ready' && (
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          )}
          {status === 'capturing' && (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-success" />
          )}
          <span className="text-xs text-muted-foreground font-medium">
            {GUIDANCE[status]}
          </span>
        </div>
      )}

      {!deviceId && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <p className="text-sm text-muted-foreground">Select a camera above</p>
        </div>
      )}
    </div>
  );
}
