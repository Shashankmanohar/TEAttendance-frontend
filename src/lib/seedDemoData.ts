// Seeding logic disabled after Supabase removal
// Seeding for Node/Express backend is pending implementation

export interface SeedProgress {
  total: number;
  current: number;
  phase: 'students' | 'attendance' | 'done';
  message: string;
}

export async function seedDemoData(
  onProgress?: (p: SeedProgress) => void
): Promise<{ studentsCreated: number; attendanceCreated: number }> {
  alert("Demo seeding is disabled as the backend has switched to Node.js. Please use the Registration page.");
  return { studentsCreated: 0, attendanceCreated: 0 };
}

export async function clearDemoData(): Promise<void> {
  alert("Clear demo data is disabled. Use the MongoDB compass/admin to clear real data.");
}
