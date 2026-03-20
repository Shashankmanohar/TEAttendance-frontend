import { uploadPhoto } from './attendanceStore';

/**
 * Uploads a file to Cloudinary via our backend proxy.
 */
export async function uploadToCloudinary(file: File): Promise<string> {
  try {
    const { url } = await uploadPhoto(file);
    return url;
  } catch (error) {
    console.error('Cloudinary upload proxy error:', error);
    throw new Error('Failed to upload image');
  }
}
