import { useEffect, useRef, useState, useCallback } from 'react';
import { parseQRData, validateQRPayload, StudentQRPayload } from '@/lib/qrUtils';

interface Options {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  enabled: boolean;
  intervalMs?: number;
}

export function useQRFromVideo({ videoRef, enabled, intervalMs = 70 }: Options) {
  const [detectedPayload, setDetectedPayload] = useState<StudentQRPayload | null>(null);
  const [supported, setSupported] = useState(true);
  const detectorRef = useRef<BarcodeDetector | null>(null);
  const intervalRef = useRef<number>(0);
  const lastRawRef = useRef<string | null>(null);
  const scanningRef = useRef(false);

  // Init BarcodeDetector once
  useEffect(() => {
    if (!('BarcodeDetector' in window)) {
      setSupported(false);
      return;
    }
    try {
      detectorRef.current = new BarcodeDetector({ formats: ['qr_code'] });
    } catch {
      setSupported(false);
    }
  }, []);

  // Scanning loop
  useEffect(() => {
    if (!enabled || !detectorRef.current) {
      clearInterval(intervalRef.current);
      return;
    }

    const scan = async () => {
      if (scanningRef.current) return; // skip if previous scan still running
      const video = videoRef.current;
      const detector = detectorRef.current;
      if (!video || !detector || video.readyState < 2) return;

      scanningRef.current = true;
      try {
        const barcodes = await detector.detect(video);
        if (barcodes.length > 0) {
          const raw = barcodes[0].rawValue;
          if (raw && raw !== lastRawRef.current) {
            lastRawRef.current = raw;
            const payload = parseQRData(raw);
            if (payload && validateQRPayload(payload)) {
              setDetectedPayload(payload);
            }
          }
        }
      } catch {
        // detection error — continue
      } finally {
        scanningRef.current = false;
      }
    };

    intervalRef.current = window.setInterval(scan, intervalMs);
    return () => clearInterval(intervalRef.current);
  }, [enabled, intervalMs, videoRef]);

  const reset = useCallback(() => {
    setDetectedPayload(null);
    lastRawRef.current = null;
  }, []);

  return { detectedPayload, supported, reset };
}
