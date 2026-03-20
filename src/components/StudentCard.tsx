import { motion, AnimatePresence } from 'framer-motion';
import { User, QrCode, ArrowUpRight } from 'lucide-react';

interface StudentCardProps {
  student: {
    name: string;
    roll_number: string;
    photo_url?: string;
    valid_until?: string;
  };
  status: string; // "You Can Enter", "Fees Not Paid", "Validity Expired"
  canEnter: boolean;
}

export function StudentCard({ student, status, canEnter }: StudentCardProps) {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  return (
    <div className="w-full max-w-sm mx-auto bg-white rounded-[40px] shadow-2xl overflow-hidden border border-gray-100 p-8 flex flex-col items-center gap-6 relative">
      {/* Top Section: Roll and Valid */}
      <div className="w-full flex justify-between items-center text-[10px] font-bold tracking-widest text-gray-400 uppercase">
        <div className="px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100">
          ROLL : {student.roll_number}
        </div>
        <div className="px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100">
          VALID : {formatDate(student.valid_until)}
        </div>
      </div>

      {/* Profile Image */}
      <div className="relative">
        <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-gray-50 shadow-lg bg-gray-100 flex items-center justify-center">
          {student.photo_url ? (
            <img src={student.photo_url} alt={student.name} className="w-full h-full object-cover" />
          ) : (
            <User className="w-16 h-16 text-gray-300" />
          )}
        </div>
      </div>

      {/* Welcome Section */}
      <div className="w-full px-6 py-5 bg-gray-50 rounded-3xl border border-gray-100 flex justify-between items-center">
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">WELCOME TO</p>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">TEAM EXCELLENT</h2>
        </div>
        <ArrowUpRight className="text-gray-300 w-6 h-6" />
      </div>

      {/* Footer Status Card */}
      <div className={`w-full p-6 rounded-[32px] ${canEnter ? 'bg-[#0f172a]' : 'bg-red-900'} text-white flex flex-col gap-4 shadow-xl shadow-slate-200`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center font-bold text-lg">
              {student.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">{student.name}</h3>
              <div className={`mt-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block ${canEnter ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                {status}
              </div>
            </div>
          </div>
          <QrCode className="w-6 h-6 text-white/40" />
        </div>
        
        <p className="text-xs text-white/50 italic font-medium leading-relaxed">
          "Consistency beats talent when talent doesn't work hard."
        </p>
      </div>
    </div>
  );
}
