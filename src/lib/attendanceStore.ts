import api from './api';
import { StudentQRPayload, getTodayDateKey } from './qrUtils';

export { getTodayDateKey };

export interface Student {
  _id: string;
  name: string;
  email: string;
  course: string;
  class_id: string;
  roll_number: string;
  parent_phone: string;
  parent_email: string;
  photo_url?: string;
  fees_paid: boolean;
  valid_until?: string;
  registered_at: string;
  qr_payload: StudentQRPayload;
  qr_code_data_url: string;
  monthlyPresenceCount?: number;
  totalPresenceCount?: number;
}

export interface AttendanceRecord {
  _id: string;
  student_id: string;
  student_name: string;
  course: string;
  class_id: string;
  roll_number: string;
  timestamp: string;
  date: string;
  status: string;
  face_image_url?: string;
  type?: 'student' | 'staff';
}

export interface MarkAttendanceResult {
  message: string;
  canEnter: boolean;
  alreadyMarked?: boolean;
  student: {
    name: string;
    roll_number: string;
    photo_url?: string;
    valid_until?: string;
  };
  record: AttendanceRecord;
}

// ──── API Calls ────

export async function getStudents(month?: string): Promise<Student[]> {
  const url = month ? `students?month=${month}` : 'students';
  const { data } = await api.get(url);
  return data;
}

export async function getStudentsByClass(classId: string): Promise<Student[]> {
  const { data } = await api.get(`students?classId=${classId}`);
  return data;
}

export async function registerStudent(studentData: any): Promise<Student> {
  const { data } = await api.post('students', studentData);
  return data;
}

export async function updateStudent(id: string, updateData: any): Promise<Student> {
  const { data } = await api.put(`students/${id}`, updateData);
  return data;
}

export const getStudentAttendance = async (id: string, month?: string, year?: string) => {
  let url = `/students/${id}/attendance`;
  if (month && year) {
    url += `?month=${month}&year=${year}`;
  }
  const response = await api.get(url);
  return response.data;
};

export async function deleteStudent(id: string): Promise<any> {
  const { data } = await api.delete(`students/${id}`);
  return data;
}

export async function toggleFeeStatus(id: string): Promise<any> {
  const { data } = await api.patch(`students/${id}/toggle-fees`);
  return data;
}

export async function markAttendance(payload: any): Promise<MarkAttendanceResult> {
  try {
    const { data } = await api.post('attendance/clock-in', {
      roll_number: payload.roll_number || payload.rollNumber || payload.studentId,
      staff_id: payload.staff_id,
      type: payload.type,
      class_id: payload.class_id || payload.classId || 'default',
      course: payload.course || ''
    });
    return data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    throw error;
  }
}

export interface AttendanceStatusResult {
  isMarked: boolean;
  message: string;
  timestamp: string | null;
  student: {
    name: string;
    roll_number: string;
    photo_url?: string;
    course: string;
    class_id: string;
  };
}

export async function checkAttendanceStatus(rollNumber: string): Promise<AttendanceStatusResult> {
  const { data } = await api.get(`attendance/check-status/${rollNumber}`);
  return data;
}

export interface LatestAttendanceResult extends AttendanceRecord {
  student_photo: string | null;
}

export async function getLatestAttendance(): Promise<LatestAttendanceResult> {
  const { data } = await api.get('attendance/latest');
  return data;
}

export interface AttendanceHistoryResponse {
  history: AttendanceRecord[];
  monthlyPresenceCount: number;
}

export async function getAttendanceRecords(date?: string): Promise<AttendanceHistoryResponse | AttendanceRecord[]> {
  const url = date ? `attendance/history?date=${date}` : 'attendance/history';
  const { data } = await api.get(url);
  return data;
}

export async function uploadPhoto(file: File): Promise<{ url: string; public_id: string }> {
  const formData = new FormData();
  formData.append('photo', file);
  const { data } = await api.post('upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
}

// ──── Class sections (Static) ────
export const getClassSections = () => [
  { id: 'nursery-a', name: 'Nursery - A', department: 'Foundation', academicYear: '2023-24' },
  { id: 'lkg-a', name: 'LKG - A', department: 'Foundation', academicYear: '2023-24' },
  { id: 'ukg-a', name: 'UKG - A', department: 'Foundation', academicYear: '2023-24' },
  { id: 'class-1-a', name: 'Class 1 - A', department: 'Primary', academicYear: '2023-24' },
  { id: 'class-2-a', name: 'Class 2 - A', department: 'Primary', academicYear: '2023-24' },
  { id: 'class-3-a', name: 'Class 3 - A', department: 'Primary', academicYear: '2023-24' },
  { id: 'class-4-a', name: 'Class 4 - A', department: 'Primary', academicYear: '2023-24' },
  { id: 'class-5-a', name: 'Class 5 - A', department: 'Primary', academicYear: '2023-24' },
  { id: 'class-6-a', name: 'Class 6 - A', department: 'Middle', academicYear: '2023-24' },
  { id: 'class-7-a', name: 'Class 7 - A', department: 'Middle', academicYear: '2023-24' },
  { id: 'class-8-a', name: 'Class 8 - A', department: 'Middle', academicYear: '2023-24' },
];

export const getClassById = (id: string) => getClassSections().find(c => c.id === id);
