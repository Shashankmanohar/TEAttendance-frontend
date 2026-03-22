import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { StudentQRPayload, parseQRData, validateQRPayload } from '../lib/qrUtils';

interface UseQRFromVideoProps {
  containerRef: React.RefObject<HTMLDivElement>;
  enabled: boolean;
  qrCameraId?: string;
}

export function useQRFromVideo({ containerRef, enabled, qrCameraId }: UseQRFromVideoProps) {
  const [detectedPayload, setDetectedPayload] = useState<StudentQRPayload | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastRawRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !qrCameraId || !containerRef.current) {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(err => console.error('Error stopping scanner:', err));
      }
      return;
    }

    const videoId = 'qr-video-container';
    // Ensure the container element has the ID required by html5-qrcode
    if (containerRef.current) {
      containerRef.current.id = videoId;
    }

    const scanner = new Html5Qrcode(videoId);
    scannerRef.current = scanner;

    const qrCodeSuccessCallback = (decodedText: string) => {
      if (decodedText !== lastRawRef.current) {
        console.log('QR Code detected:', decodedText);
        lastRawRef.current = decodedText;
        const payload = parseQRData(decodedText);
        
        if (payload && validateQRPayload(payload)) {
          console.log('QR Validated successfully:', payload);
          setDetectedPayload(payload);
        } else {
          console.warn('QR Code validation failed or irrelevant:', decodedText);
          // Reset lastRaw so we can try scanning again soon if it was just a bad read
          setTimeout(() => { lastRawRef.current = null; }, 2000);
        }
      }
    };

    const config = { 
      fps: 30, 
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0
    };

    scanner.start(
      qrCameraId,
      config,
      qrCodeSuccessCallback,
      () => {} // Silent error callback during scanning
    ).catch(err => {
      console.error('Failed to start Html5Qrcode scanner:', err);
    });

    return () => {
      if (scanner.isScanning) {
        scanner.stop().catch(err => console.error('Error stopping scanner on cleanup:', err));
      }
    };
  }, [enabled, qrCameraId, containerRef]);

  const reset = () => {
    setDetectedPayload(null);
    lastRawRef.current = null;
  };

  return { detectedPayload, reset };
}
