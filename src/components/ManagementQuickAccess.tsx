import { motion } from 'framer-motion';
import { Users, UserCheck, ArrowRight, Database, ShieldCheck, QrCode } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function ManagementQuickAccess() {
  const managers = [
    {
      title: 'Student Registry',
      description: 'Manage student profiles, registration, and fee status.',
      icon: Users,
      link: '/students',
      color: 'from-blue-500 to-indigo-600',
      shadow: 'shadow-blue-100',
      stats: 'Global Database',
      badge: 'Active Control'
    },
    {
      title: 'Staff Directory',
      description: 'Oversee staff members, attendance, and credentials.',
      icon: UserCheck,
      link: '/admin/staff',
      color: 'from-[#8424bd] to-[#5e188e]',
      shadow: 'shadow-purple-100',
      stats: 'Personal Records',
      badge: 'Admin Level'
    },
    {
      title: 'Attendance Terminal',
      description: 'Launch the high-speed QR verification system for the institution.',
      icon: QrCode,
      link: '/admin/scanner',
      color: 'from-orange-500 to-red-600',
      shadow: 'shadow-orange-100',
      stats: 'Live Verification',
      badge: 'High Speed'
    }
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
      {managers.map((item, index) => (
        <motion.div
          key={item.title}
          initial={{ opacity: 0, x: index === 0 ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 + index * 0.1, type: "spring", stiffness: 100 }}
          className="group relative"
        >
          <div className="relative overflow-hidden rounded-[32px] bg-white border border-slate-100 p-6 md:p-8 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-slate-200/60 transition-all duration-500">
            {/* Background Accent */}
            <div className={`absolute -right-20 -bottom-20 w-64 h-64 rounded-full bg-gradient-to-br ${item.color} opacity-[0.03] group-hover:opacity-[0.05] transition-opacity duration-700 group-hover:scale-150`} />
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex justify-between items-start mb-6 md:mb-8">
                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg ${item.shadow} group-hover:scale-110 transition-transform duration-500 shadow-xl`}>
                  <item.icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
                </div>
                <div className="flex flex-col items-end gap-1.5">
                   <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-100 text-[8px] font-black uppercase tracking-widest text-slate-400">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      {item.badge}
                   </div>
                </div>
              </div>

              <div className="mb-6 md:mb-8">
                <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight group-hover:text-[#8424bd] transition-colors mb-2">
                  {item.title}
                </h3>
                <p className="text-slate-500 text-xs md:text-sm font-medium leading-relaxed max-w-[220px] md:max-w-[260px]">
                  {item.description}
                </p>
              </div>

              <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                      <Database className="w-4 h-4 text-slate-300" />
                   </div>
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                      {item.stats}
                   </span>
                </div>
                
                <Link to={item.link}>
                  <Button 
                    className={`h-11 px-6 rounded-xl bg-slate-900 hover:bg-[#8424bd] text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-slate-100 transition-all active:scale-95 flex items-center gap-2`}
                  >
                    Enter Management
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
