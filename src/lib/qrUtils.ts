import QRCode from 'qrcode';
import CryptoJS from 'crypto-js';

const SECRET_KEY = 'attendance-system-2024-secure-key';

export interface StudentQRPayload {
  roll_number: string;
  class_id: string;
  course: string;
  studentId?: string;
  studentName?: string;
  timestamp?: number;
  hash?: string;
}

export function generateStudentPayload(
  studentId: string,
  studentName: string,
  course: string
): StudentQRPayload {
  const timestamp = Date.now();
  const dataToHash = `${studentId}-${studentName}-${course}-${timestamp}`;
  const hash = CryptoJS.HmacSHA256(dataToHash, SECRET_KEY).toString();

  return {
    roll_number: studentId, // Using studentId as roll_number for compatibility
    class_id: 'default',
    course,
    studentId,
    studentName,
    timestamp,
    hash,
  };
}

export function validateQRPayload(payload: StudentQRPayload): boolean {
  // If it has a hash, validate it. If not (backend simple format), return true
  if (!payload.hash) return true;
  
  const dataToHash = `${payload.studentId}-${payload.studentName}-${payload.course}-${payload.timestamp}`;
  const expectedHash = CryptoJS.HmacSHA256(dataToHash, SECRET_KEY).toString();
  return payload.hash === expectedHash;
}

export async function generateQRCode(payload: StudentQRPayload): Promise<string> {
  try {
    const qrDataUrl = await QRCode.toDataURL(JSON.stringify(payload), {
      width: 300,
      margin: 2,
      color: {
        dark: '#1e293b',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    });
    return qrDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
}

export function parseQRData(data: string): StudentQRPayload | null {
  try {
    const parsed = JSON.parse(data);
    // Be flexible: accept roll_number, studentId, or staff_id
    if (parsed.roll_number || parsed.studentId || parsed.staff_id) {
      return {
        roll_number: parsed.roll_number || parsed.studentId || parsed.staff_id,
        class_id: parsed.class_id || '',
        course: parsed.course || '',
        ...parsed
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function getTodayDateKey(): string {
  return new Date().toISOString().split('T')[0];
}
