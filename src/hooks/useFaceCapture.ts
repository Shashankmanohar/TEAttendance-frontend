import { useCallback } from 'react';

interface FaceCaptureResult {
  blob: Blob;
  dataUrl: string;
}

export function useFaceCapture() {
  const captureFrame = useCallback(async (videoElement: HTMLVideoElement): Promise<FaceCaptureResult | null> => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('Failed to get canvas context');
        return null;
      }

      // Draw the current video frame to canvas
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

      // Get data URL for preview
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

      // Convert canvas to blob for upload
      return new Promise((resolve) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({ blob, dataUrl });
            } else {
              resolve(null);
            }
          },
          'image/jpeg',
          0.85
        );
      });
    } catch (error) {
      console.error('Error capturing frame:', error);
      return null;
    }
  }, []);

  const captureFromStream = useCallback(async (stream: MediaStream): Promise<FaceCaptureResult | null> => {
    try {
      // Create a temporary video element
      const video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      
      await video.play();
      
      // Wait a frame to ensure video is ready
      await new Promise(resolve => requestAnimationFrame(resolve));
      
      const result = await captureFrame(video);
      
      return result;
    } catch (error) {
      console.error('Error capturing from stream:', error);
      return null;
    }
  }, [captureFrame]);

  return {
    captureFrame,
    captureFromStream,
  };
}