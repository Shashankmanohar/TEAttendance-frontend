import { StudentManagement } from '@/components/StudentManagement';

export default function Students() {
  return (
    <div className="page-container">
      <div className="page-header border-none mb-2">
        <h1 className="page-title text-4xl font-black">STUDENTS</h1>
        <p className="page-subtitle font-bold uppercase tracking-[0.2em] text-[10px] text-slate-400">Roster & Fee Management</p>
      </div>
      <StudentManagement />
    </div>
  );
}
