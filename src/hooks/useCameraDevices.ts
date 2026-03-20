import { useState, useEffect, useCallback } from 'react';

export interface CameraDevice {
  deviceId: string;
  label: string;
}

export function useCameraDevices() {
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [faceCameraId, setFaceCameraId] = useState<string>('');
  const [qrCameraId, setQrCameraId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const enumerate = useCallback(async () => {
    try {
      // Request permission so labels are available
      try {
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
        tempStream.getTracks().forEach((t) => t.stop());
      } catch {
        // permission may already be granted
      }

      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices
        .filter((d) => d.kind === 'videoinput' && d.deviceId)
        .map((d, i) => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${i + 1}`,
        }));

      setDevices(videoDevices);
      setError(videoDevices.length === 0 ? 'No cameras found' : null);

      // Auto-select cameras
      if (videoDevices.length >= 2) {
        setFaceCameraId((prev) => prev || videoDevices[0].deviceId);
        setQrCameraId((prev) => prev || videoDevices[1].deviceId);
      } else if (videoDevices.length === 1) {
        setFaceCameraId((prev) => prev || videoDevices[0].deviceId);
        setQrCameraId((prev) => prev || videoDevices[0].deviceId);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to access cameras');
    }
  }, []);

  useEffect(() => {
    enumerate();

    // Listen for camera connect/disconnect (e.g. Camo app starting later)
    const handler = () => enumerate();
    navigator.mediaDevices?.addEventListener('devicechange', handler);
    return () => navigator.mediaDevices?.removeEventListener('devicechange', handler);
  }, [enumerate]);

  // Only flag conflict when there are multiple cameras available
  const isSameCamera = !!(faceCameraId && qrCameraId && faceCameraId === qrCameraId && devices.length > 1);

  return {
    devices,
    faceCameraId,
    setFaceCameraId,
    qrCameraId,
    setQrCameraId,
    isSameCamera,
    error,
    refresh: enumerate,
  };
}
