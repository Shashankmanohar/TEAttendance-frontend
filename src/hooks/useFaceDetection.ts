import { useEffect, useRef, useState, useCallback } from 'react';

export type FaceStatus = 'loading' | 'no_face' | 'aligning' | 'ready' | 'capturing' | 'captured';

const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite';
const WASM_CDN =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm';

interface Options {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  enabled: boolean;
  confidenceThreshold?: number;
  stabilityFrames?: number;
  readyDurationMs?: number;
}

export function useFaceDetection({
  videoRef,
  enabled,
  confidenceThreshold = 0.80,
  stabilityFrames = 5,
  readyDurationMs = 400,
}: Options) {
  const [status, setStatus] = useState<FaceStatus>('loading');
  const [modelLoaded, setModelLoaded] = useState(false);
  const detectorRef = useRef<any>(null);
  const stableRef = useRef(0);
  const readyAtRef = useRef<number | null>(null);
  const rafRef = useRef(0);
  const lastRef = useRef(0);

  // Load model once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { FaceDetector, FilesetResolver } = await import(
          '@mediapipe/tasks-vision'
        );
        const vision = await FilesetResolver.forVisionTasks(WASM_CDN);
        const detector = await FaceDetector.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
          runningMode: 'VIDEO',
          minDetectionConfidence: confidenceThreshold,
        });
        if (!cancelled) {
          detectorRef.current = detector;
          setModelLoaded(true);
          setStatus('no_face');
        }
      } catch (err) {
        console.error('Face detection model load failed:', err);
        if (!cancelled) setStatus('no_face');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Detection loop — runs when enabled + model loaded
  useEffect(() => {
    if (!enabled || !modelLoaded) return;

    // Reset counters each cycle
    stableRef.current = 0;
    readyAtRef.current = null;

    let active = true;

    const loop = (ts: number) => {
      if (!active) return;

      // ~20 fps throttle
      if (ts - lastRef.current < 50) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      lastRef.current = ts;

      const video = videoRef.current;
      const detector = detectorRef.current;
      if (!video || !detector || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      try {
        const { detections } = detector.detectForVideo(video, ts);

        if (detections.length === 1) {
          const kp = detections[0].keypoints;
          if (kp && kp.length >= 3) {
            const rEye = kp[0];
            const lEye = kp[1];
            const nose = kp[2];

            // Frontal check: nose horizontally centered between eyes
            const eyeMidX = (rEye.x + lEye.x) / 2;
            const eyeSpan = Math.abs(lEye.x - rEye.x);
            const isFrontal = Math.abs(nose.x - eyeMidX) < eyeSpan * 0.35;

            // Centered in frame (normalized 0-1 coords)
            const cx = (rEye.x + lEye.x) / 2;
            const cy = nose.y;
            const isCentered =
              cx > 0.15 && cx < 0.85 && cy > 0.15 && cy < 0.85;

            // Face size via eye span
            const goodSize = eyeSpan > 0.06 && eyeSpan < 0.45;

            if (isFrontal && isCentered && goodSize) {
              stableRef.current++;
              if (stableRef.current >= stabilityFrames) {
                if (!readyAtRef.current) {
                  readyAtRef.current = Date.now();
                  setStatus('ready');
                } else if (
                  Date.now() - readyAtRef.current >=
                  readyDurationMs
                ) {
                  setStatus('capturing');
                  return; // Stop loop — parent will handle capture
                }
              } else {
                setStatus('aligning');
              }
            } else {
              stableRef.current = Math.max(0, stableRef.current - 2);
              readyAtRef.current = null;
              setStatus(stableRef.current > 0 ? 'aligning' : 'no_face');
            }
          }
        } else {
          stableRef.current = 0;
          readyAtRef.current = null;
          setStatus('no_face');
        }
      } catch {
        /* continue on detection error */
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      active = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [enabled, modelLoaded, stabilityFrames, readyDurationMs, videoRef]);

  const reset = useCallback(() => {
    stableRef.current = 0;
    readyAtRef.current = null;
    setStatus(detectorRef.current ? 'no_face' : 'loading');
  }, []);

  return { status, reset, modelLoaded };
}
