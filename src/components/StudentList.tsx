import { useState, useEffect } from 'react';
import { getStudents, toggleFeeStatus, updateStudent, deleteStudent, Student, getClassSections, getStudentAttendance } from '@/lib/attendanceStore';
import AttendanceCalendar from './AttendanceCalendar';
import { generateStudentPayload } from '@/lib/qrUtils';
import { Button } from '@/components/ui/button';
import { Check, X, Loader2, RefreshCw, User, Search, Download, Edit2, Trash2, AlertCircle, Users, QrCode, ShieldCheck, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import QRCode from 'qrcode';

export function StudentList() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [viewDate, setViewDate] = useState(new Date());
  
  // Edit/Delete states
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [selectedStudentForDetails, setSelectedStudentForDetails] = useState<Student | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [calendarDate, setCalendarDate] = useState(new Date());

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const monthParam = format(viewDate, 'yyyy-MM');
      const data = await getStudents(monthParam);
      setStudents(data);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to fetch students');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [viewDate]);

  useEffect(() => {
    if (selectedStudentForDetails) {
      fetchStudentAttendance(selectedStudentForDetails._id);
    }
  }, [selectedStudentForDetails, calendarDate]);

  const fetchStudentAttendance = async (id: string) => {
    try {
      const month = format(calendarDate, 'MM');
      const year = format(calendarDate, 'yyyy');
      const records = await getStudentAttendance(id, month, year);
      setAttendanceRecords(records);
    } catch (error) {
      console.error('Failed to fetch student attendance', error);
    }
  };

  const handlePrevMonth = () => setViewDate(prev => subMonths(prev, 1));
  const handleNextMonth = () => setViewDate(prev => addMonths(prev, 1));

  const handleToggleFees = async (studentId: string) => {
    if (!studentId) {
      toast.error('Student ID missing');
      return;
    }
    setTogglingId(studentId);
    try {
      await toggleFeeStatus(studentId);
      setStudents(prev => prev.map(s => 
        s._id === studentId ? { ...s, fees_paid: !s.fees_paid } : s
      ));
      toast.success('Fee status updated');
    } catch (error) {
      console.error('Error toggling fees:', error);
      toast.error('Failed to update fee status');
    } finally {
      setTogglingId(null);
    }
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setIsActionLoading(true);
    try {
      const updated = await updateStudent(editingStudent._id, editingStudent);
      setStudents(prev => prev.map(s => s._id === updated._id ? updated : s));
      toast.success('Student updated successfully');
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating student:', error);
      toast.error('Failed to update student');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!deletingStudent) return;
    setIsActionLoading(true);
    try {
      await deleteStudent(deletingStudent._id);
      setStudents(prev => prev.filter(s => s._id !== deletingStudent._id));
      toast.success('Student deleted successfully');
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting student:', error);
      toast.error('Failed to delete student');
    } finally {
      setIsActionLoading(false);
      setDeletingStudent(null);
    }
  };
  
  const handleDownloadCard = async (student: Student) => {
    const toastId = toast.loading(`Generating QR for ${student.name}...`);
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = 400;
      canvas.height = 450;

      // Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Student Info
      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'center';
      
      // Name
      ctx.font = 'bold 32px Inter, sans-serif';
      ctx.fillText(student.name.toUpperCase(), canvas.width / 2, 60);
      
      // Roll & Course
      const roll = student.roll_number || 'N/A';
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 18px Inter, sans-serif';
      ctx.fillText(`ROLL: ${roll}`, canvas.width / 2, 100);
      ctx.fillText(`COURSE: ${student.course}`, canvas.width / 2, 130);

      // QR Code Section
      const qrScale = 240;
      const qrY = 160;
      
      // Generate QR Code
      const qrPayload = student.qr_payload || generateStudentPayload(student._id, student.name, student.course);
      const qrData = JSON.stringify(qrPayload);
      
      const qrCanvas = document.createElement('canvas');
      await QRCode.toCanvas(qrCanvas, qrData, {
        margin: 1,
        width: qrScale,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      });
      
      ctx.drawImage(qrCanvas, canvas.width / 2 - qrScale / 2, qrY, qrScale, qrScale);

      // Download
      const link = document.createElement('a');
      link.download = `student-qr-${roll}.png`;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('QR downloaded', { id: toastId });
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to generate QR', { id: toastId });
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.roll_number || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 p-1">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
        <div className="relative w-full sm:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 transition-colors group-focus-within:text-[#8424bd]" />
          <Input 
            placeholder="Search student records..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 rounded-2xl h-11 border-none bg-white shadow-sm focus-visible:ring-2 focus-visible:ring-purple-100 transition-all font-medium text-sm"
          />
        </div>
        <div className="flex items-center gap-4 bg-white p-2 rounded-[24px] border border-slate-100 shadow-sm w-full sm:w-auto">
             <button 
              onClick={handlePrevMonth}
              className="p-3 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-[#8424bd] transition-all active:scale-90"
             >
                <ChevronLeft className="w-5 h-5" />
             </button>
             <div className="px-4 flex items-center gap-3 border-x border-slate-50">
                <CalendarIcon className="w-4 h-4 text-[#8424bd]" />
                <span className="font-black text-[11px] uppercase tracking-widest text-slate-700 min-w-[120px] text-center">{format(viewDate, 'MMMM yyyy')}</span>
             </div>
             <button 
              onClick={handleNextMonth}
              className="p-3 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-[#8424bd] transition-all active:scale-90"
             >
                <ChevronRight className="w-5 h-5" />
             </button>
        </div>

        <Button 
          variant="outline" 
          onClick={fetchStudents} 
          disabled={isLoading}
          className="rounded-2xl h-11 px-6 font-black text-[10px] tracking-widest uppercase flex gap-2.5 bg-white border-slate-100 hover:bg-slate-50 shadow-sm transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#8424bd] ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
      {isLoading ? (
        Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-[420px] rounded-[40px] bg-white/40 animate-pulse border border-slate-100" />
        ))
      ) : filteredStudents.length === 0 ? (
        <div className="col-span-full py-32 text-center bg-white/50 backdrop-blur-sm rounded-[40px] border border-dashed border-slate-200">
           <div className="flex flex-col items-center max-w-sm mx-auto">
              <div className="w-24 h-24 bg-slate-50 rounded-[32px] flex items-center justify-center mb-8 shadow-inner">
                 <Users className="w-12 h-12 text-slate-200" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Registry is Clear</h3>
              <p className="text-sm text-slate-400 font-medium">
                {searchQuery 
                  ? `No student records were detected matching "${searchQuery}" in our system.` 
                  : "The student registration directory is currently empty. Start by adding a new student."}
              </p>
              {searchQuery && (
                <Button 
                  variant="link" 
                  onClick={() => setSearchQuery('')}
                  className="mt-4 text-[#8424bd] font-bold uppercase tracking-widest text-[10px]"
                >
                  Clear Search Filter
                </Button>
              )}
           </div>
        </div>
      ) : (
        filteredStudents.map((student, i) => (
          <motion.div
            key={student._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="group relative bg-white/70 backdrop-blur-xl rounded-[32px] sm:rounded-[40px] border border-white/40 shadow-2xl shadow-slate-200/40 p-6 sm:p-8 hover:shadow-purple-100/50 transition-all duration-500 hover:-translate-y-2 overflow-hidden flex flex-col"
          >
            {/* Background Decorative Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#8424bd]/5 rounded-bl-[100px] -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700 pointer-events-none" />

            <div className="flex items-start justify-between mb-8 relative z-10">
              <div className="relative">
                <div className="w-24 h-24 rounded-[32px] bg-white overflow-hidden border-2 border-slate-50 shadow-xl ring-8 ring-slate-50/50 transition-transform group-hover:scale-105 duration-500">
                  {student.photo_url ? (
                    <img src={student.photo_url} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                       <User className="w-10 h-10 text-slate-200" />
                    </div>
                  )}
                </div>
                <div className={cn(
                  "absolute -bottom-2 -right-2 w-10 h-10 rounded-full border-4 border-white shadow-lg flex items-center justify-center transition-all duration-500",
                  student.fees_paid ? "bg-emerald-500 scale-100" : "bg-rose-500 scale-110 animate-pulse"
                )}>
                  {student.fees_paid ? <Check className="w-5 h-5 text-white stroke-[3]" /> : <X className="w-5 h-5 text-white stroke-[3]" />}
                </div>
              </div>

              <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-500">
                 <Button 
                  variant="secondary" size="icon" className="w-10 h-10 rounded-2xl bg-white shadow-lg border-none text-slate-500 hover:text-blue-600 hover:scale-110 transition-all"
                  onClick={() => { setEditingStudent(student); setIsEditDialogOpen(true); }}
                >
                  <Edit2 className="w-4.5 h-4.5" />
                </Button>
                <Button 
                  variant="secondary" size="icon" className="w-10 h-10 rounded-2xl bg-white shadow-lg border-none text-slate-500 hover:text-rose-500 hover:scale-110 transition-all"
                  onClick={() => { setDeletingStudent(student); setIsDeleteDialogOpen(true); }}
                >
                  <Trash2 className="w-4.5 h-4.5" />
                </Button>
              </div>
            </div>

            <div className="space-y-6 relative z-10 flex-1 flex flex-col">
              <div>
                <h3 className="font-black text-2xl text-slate-900 tracking-tight mb-1 group-hover:text-[#8424bd] transition-colors">{student.name}</h3>
                <div className="flex items-center gap-2">
                   <div className="flex items-center gap-2">
                     <span className="text-xs font-black text-[#8424bd] bg-purple-50 px-3 py-1 rounded-full uppercase tracking-widest">{student.roll_number}</span>
                     {student.monthlyPresenceCount !== undefined && (
                        <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg uppercase tracking-wider">{student.monthlyPresenceCount} Days in {format(viewDate, 'MMM')}</span>
                     )}
                     {student.totalPresenceCount !== undefined && (
                        <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg uppercase tracking-wider">{student.totalPresenceCount} Total Days</span>
                     )}
                   </div>
                   <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">• STUDENT PROFILE</span>
                </div>
              </div>

              <div className="space-y-4 py-6 border-y border-slate-50">
                <div className="flex items-center gap-4 text-slate-600">
                   <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center">
                     <QrCode className="w-5 h-5 text-[#8424bd]" />
                   </div>
                   <div className="translate-y-0.5">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Roll Identification</p>
                     <p className="font-mono font-black text-sm tracking-wider">{student.roll_number || 'STU-000'}</p>
                   </div>
                </div>

                <div className="flex items-center gap-4">
                   <div className={cn(
                     "w-10 h-10 rounded-2xl flex items-center justify-center transition-colors",
                     student.fees_paid ? "bg-emerald-50" : "bg-rose-50"
                   )}>
                     <ShieldCheck className={cn("w-5 h-5", student.fees_paid ? "text-emerald-500" : "text-rose-500")} />
                   </div>
                   <div className="translate-y-0.5">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Fee Clearance Status</p>
                     <div className="flex items-center gap-2">
                        <p className={cn("font-bold text-sm", student.fees_paid ? "text-emerald-600" : "text-rose-600 uppercase italic")}>
                          {student.fees_paid ? 'Payment Verified' : 'Outstanding Balance'}
                        </p>
                        {!student.fees_paid && <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />}
                     </div>
                   </div>
                </div>
              </div>

             <div className="flex flex-col gap-3 pt-4 mt-auto">
                <div className="flex items-center gap-3">
                  <Button 
                    onClick={() => handleToggleFees(student._id)}
                    disabled={togglingId === student._id}
                    className={cn(
                      "flex-1 h-12 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3",
                      student.fees_paid 
                        ? "bg-slate-900 hover:opacity-90 text-white shadow-slate-200" 
                        : "bg-[#8424bd] hover:opacity-90 text-white shadow-purple-200"
                    )}
                  >
                    {togglingId === student._id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : student.fees_paid ? (
                      <>REVOKE<X className="w-4 h-4" /></>
                    ) : (
                      <>APPROVE<Check className="w-4 h-4" /></>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                     onClick={() => handleDownloadCard(student)}
                    className="w-12 h-12 rounded-2xl border-slate-100 text-slate-400 hover:text-[#8424bd] hover:border-purple-100 transition-all flex items-center justify-center shadow-sm"
                  >
                    <Download className="w-5 h-5" />
                  </Button>
                </div>
                
                <Button
                  onClick={() => setSelectedStudentForDetails(student)}
                  className="w-full h-14 rounded-2xl bg-white border border-slate-100 text-slate-900 hover:bg-slate-50 font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 group/registry shadow-sm"
                >
                  Registry View
                  <ChevronRight className="w-4 h-4 transition-transform group-hover/registry:translate-x-1" />
                </Button>
              </div>
            </div>
          </motion.div>
        ))
      )}
    </div>

    {/* Student Detail Dialog */}
    <Dialog open={!!selectedStudentForDetails} onOpenChange={(open) => !open && setSelectedStudentForDetails(null)}>
      <DialogContent className="max-w-4xl rounded-[40px] border-none shadow-2xl p-0 overflow-hidden bg-white max-h-[90vh] flex flex-col">
        {selectedStudentForDetails && (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="h-40 bg-gradient-to-br from-[#8424bd] to-[#5e188e] p-8 relative overflow-hidden shrink-0">
               <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
               <div className="relative z-10 flex items-center gap-6">
                  <div className="w-24 h-24 rounded-[32px] bg-white border-4 border-white overflow-hidden shadow-2xl">
                    {selectedStudentForDetails.photo_url ? (
                      <img src={selectedStudentForDetails.photo_url} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-200">
                        <User className="w-12 h-12" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-white tracking-tight uppercase italic">{selectedStudentForDetails.name}</h2>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black text-white uppercase tracking-widest border border-white/20">
                        {selectedStudentForDetails.roll_number}
                      </span>
                      <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black text-white uppercase tracking-widest border border-white/20">
                        {selectedStudentForDetails.course}
                      </span>
                    </div>
                  </div>
               </div>
            </div>
            
            <div className="p-10 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 rounded-[32px] bg-emerald-50 border border-emerald-100">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-2 text-center">Current Month</p>
                  <p className="text-4xl font-black text-emerald-700 text-center tracking-tighter">
                    {selectedStudentForDetails.monthlyPresenceCount || 0}
                    <span className="text-sm ml-1 opacity-60">DAYS</span>
                  </p>
                  <p className="text-[9px] font-black text-emerald-600/60 uppercase tracking-widest text-center mt-2 italic">IN {format(viewDate, 'MMMM yyyy')}</p>
                </div>
                <div className="p-6 rounded-[32px] bg-blue-50 border border-blue-100">
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2 text-center">Lifetime Presence</p>
                  <p className="text-4xl font-black text-blue-700 text-center tracking-tighter">
                    {selectedStudentForDetails.totalPresenceCount || 0}
                    <span className="text-sm ml-1 opacity-60">DAYS</span>
                  </p>
                  <p className="text-[9px] font-black text-blue-600/60 uppercase tracking-widest text-center mt-2 italic">SINCE REGISTRATION</p>
                </div>
              </div>

              <div className="bg-slate-50/50 rounded-[40px] p-6 border border-slate-100">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 pl-2">Attendance Log Calendar</p>
                 <AttendanceCalendar 
                    records={attendanceRecords} 
                    currentDate={calendarDate}
                    setCurrentDate={setCalendarDate}
                  />
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={() => setSelectedStudentForDetails(null)}
                  className="h-14 px-8 rounded-2xl bg-slate-900 text-white font-black text-[11px] uppercase tracking-[0.2em]"
                >
                  Dismiss Profile
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>

      {/* Edit Dialog - Premium Update */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md rounded-[40px] border-none shadow-2xl p-0 overflow-hidden bg-white">
          <div className="h-32 bg-gradient-to-br from-[#8424bd] to-[#5e188e] flex items-center px-10 relative overflow-hidden">
             <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
             <div className="z-10">
               <h2 className="text-2xl font-black text-white tracking-tight">Edit Student</h2>
               <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Update Identification Records</p>
             </div>
          </div>
          <form onSubmit={handleUpdateStudent} className="p-10 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Student Name</Label>
              <Input 
                value={editingStudent?.name || ''} 
                onChange={(e) => setEditingStudent(prev => prev ? { ...prev, name: e.target.value } : null)}
                className="rounded-2xl h-14 bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-purple-100 font-bold text-slate-900"
              />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Roll ID</Label>
                <Input 
                  value={editingStudent?.roll_number || ''} 
                  onChange={(e) => setEditingStudent(prev => prev ? { ...prev, roll_number: e.target.value } : null)}
                  className="rounded-2xl h-14 bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-purple-100 font-mono font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Department</Label>
                <Input 
                  value={editingStudent?.course || ''} 
                  onChange={(e) => setEditingStudent(prev => prev ? { ...prev, course: e.target.value } : null)}
                  className="rounded-2xl h-14 bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-purple-100 font-bold"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Assigned Batch</Label>
              <Select 
                value={editingStudent?.class_id} 
                onValueChange={(val) => setEditingStudent(prev => prev ? { ...prev, class_id: val } : null)}
              >
                <SelectTrigger className="rounded-2xl h-14 bg-slate-50 border-none focus:ring-2 focus:ring-purple-100 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                  {getClassSections().map((section) => (
                    <SelectItem key={section.id} value={section.id} className="rounded-xl font-bold py-3">
                      {section.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              type="submit" 
              disabled={isActionLoading}
              className="w-full h-14 rounded-2xl bg-[#8424bd] hover:bg-[#721fac] text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-purple-100 transition-all mt-4"
            >
              {isActionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Changes'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation - Premium Update */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-[40px] border-none shadow-2xl p-10 bg-white">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-[28px] bg-rose-50 flex items-center justify-center mb-6 animate-pulse">
              <AlertCircle className="w-10 h-10 text-rose-500" />
            </div>
            <AlertDialogTitle className="text-3xl font-black text-slate-900 tracking-tight">Security Alert</AlertDialogTitle>
            <AlertDialogDescription className="mt-4 text-slate-500 font-medium leading-relaxed">
              You are about to permanently remove <strong>{deletingStudent?.name}</strong> from the primary registry. This action is <span className="text-rose-600 font-bold italic underline">irreversible</span> and will erase all historical data.
            </AlertDialogDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 mt-10">
            <AlertDialogCancel className="flex-1 rounded-2xl h-14 border-slate-100 font-black text-[11px] tracking-widest uppercase hover:bg-slate-50 transition-all">Abort Action</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleDeleteStudent();
              }}
              disabled={isActionLoading}
              className="flex-1 rounded-2xl h-14 bg-rose-500 hover:bg-rose-600 text-white font-black text-[11px] tracking-widest uppercase shadow-lg shadow-rose-100 transition-all border-none"
            >
              {isActionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Delete'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
