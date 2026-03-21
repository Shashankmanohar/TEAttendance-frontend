import { useEffect, useRef, useState, useCallback } from 'react';
import { parseQRData, validateQRPayload, StudentQRPayload } from '@/lib/qrUtils';

interface Options {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  enabled: boolean;
  intervalMs?: number;
}

export function useQRFromVideo({ videoRef, enabled }: Options) {
  const [detectedPayload, setDetectedPayload] = useState<StudentQRPayload | null>(null);
  const [supported, setSupported] = useState(true);
  const lastRawRef = useRef<string | null>(null);
  const scanningRef = useRef(false);

  // Check support
  useEffect(() => {
    if (!('BarcodeDetector' in window)) {
      setSupported(false);
      console.warn('BarcodeDetector is not supported in this browser.');
    }
  }, []);

  // Scanning loop
  useEffect(() => {
    if (!enabled) return;

    let detector: any = null;
    if ('BarcodeDetector' in window) {
      try {
        // @ts-ignore
        detector = new BarcodeDetector({ formats: ['qr_code'] });
      } catch (e) {
        console.warn('BarcodeDetector found but failed to init:', e);
      }
    }

    if (!detector) return;

    const scan = async () => {
      if (scanningRef.current) return;
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;

      scanningRef.current = true;
      try {
        const barcodes = await detector.detect(video);
        if (barcodes.length > 0) {
          const raw = barcodes[0].rawValue;
          if (raw && raw !== lastRawRef.current) {
            lastRawRef.current = raw;
            const payload = parseQRData(raw);
            if (payload && validateQRPayload(payload)) {
              console.log('QR Detected and Parsed:', payload);
              setDetectedPayload(payload);
            } else {
              // If it's not a valid payload for our system, clear lastRawRef so we can try again
              // (unless we want to avoid spamming invalid QR messages)
              lastRawRef.current = null;
            }
          }
        }
      } catch (err) {
        // detection error — continue
      } finally {
        scanningRef.current = false;
      }
    };

    const intervalId = setInterval(scan, 30); // 33 FPS - Very fast
    return () => clearInterval(intervalId);
  }, [enabled, videoRef]);

  const reset = useCallback(() => {
    setDetectedPayload(null);
    lastRawRef.current = null;
  }, []);

  return { detectedPayload, supported, reset };
}
