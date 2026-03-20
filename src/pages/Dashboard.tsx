import { DashboardStats } from '@/components/DashboardStats';
import { AttendanceLogs } from '@/components/AttendanceLogs';

export default function Dashboard() {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="page-container space-y-8">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">{today}</p>
      </div>
      <DashboardStats />
      <AttendanceLogs />
    </div>
  );
}
