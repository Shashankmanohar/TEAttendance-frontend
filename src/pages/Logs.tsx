import { AttendanceLogs } from '@/components/AttendanceLogs';

export default function Logs() {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Attendance Logs</h1>
        <p className="page-subtitle">Complete history of all attendance records</p>
      </div>
      <AttendanceLogs />
    </div>
  );
}
