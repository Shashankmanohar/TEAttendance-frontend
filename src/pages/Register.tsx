import { StudentRegistration } from '@/components/StudentRegistration';

export default function Register() {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Register Student</h1>
        <p className="page-subtitle">Add a new student and generate their QR code</p>
      </div>
      <StudentRegistration />
    </div>
  );
}
