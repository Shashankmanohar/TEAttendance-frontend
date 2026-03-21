import { useState, useEffect } from 'react';
import { getStudents, toggleFeeStatus, updateStudent, deleteStudent, Student, getClassSections } from '@/lib/attendanceStore';
import { generateStudentPayload } from '@/lib/qrUtils';
import { Button } from '@/components/ui/button';
import { Check, X, Loader2, RefreshCw, User, Search, Download, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
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
  
  // Edit/Delete states
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const data = await getStudents();
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
  }, []);

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search name or roll number..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-2xl h-11 border-slate-200"
          />
        </div>
        <Button 
          variant="outline" 
          onClick={fetchStudents} 
          disabled={isLoading}
          className="rounded-2xl h-11 px-6 font-bold flex gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh List
        </Button>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Roll Number</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Course</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Fees Paid</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-400 font-medium tracking-tight">Loading students...</p>
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <p className="text-sm text-slate-400 font-medium tracking-tight">No students found.</p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, index) => {
                  return (
                    <tr key={student._id || `student-${index}`} className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden border border-slate-50 flex items-center justify-center">
                          {student.photo_url ? (
                            <img src={student.photo_url} alt={student.name} className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-5 h-5 text-slate-300" />
                          )}
                        </div>
                        <span className="font-bold text-slate-900">{student.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-md min-w-[60px] inline-block text-center">
                        {student.roll_number || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-500">{student.course}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        student.fees_paid 
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                          : 'bg-red-50 text-red-600 border border-red-100'
                      }`}>
                        {student.fees_paid ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        {student.fees_paid ? 'PAID' : 'NOT PAID'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadCard(student)}
                          title="Download QR Card"
                          className="rounded-xl px-3 font-bold text-xs h-9 border-slate-200 text-slate-600 hover:bg-slate-50"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingStudent(student);
                            setIsEditDialogOpen(true);
                          }}
                          title="Edit Student"
                          className="rounded-xl px-3 font-bold text-xs h-9 border-slate-200 text-blue-600 hover:bg-blue-50"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setDeletingStudent(student);
                            setIsDeleteDialogOpen(true);
                          }}
                          title="Delete Student"
                          className="rounded-xl px-3 font-bold text-xs h-9 border-slate-200 text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                        <div className="w-px h-6 bg-slate-100 mx-1 self-center" />
                        <Button
                          size="sm"
                          variant={student.fees_paid ? "outline" : "default"}
                          onClick={() => handleToggleFees(student._id)}
                          disabled={togglingId === student._id}
                          className={`rounded-xl px-4 font-bold text-xs h-9 transition-all active:scale-95 ${
                            !student.fees_paid ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'border-red-200 text-red-600 hover:bg-red-50'
                          }`}
                        >
                          {togglingId === student._id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : student.fees_paid ? (
                            'Unpaid'
                          ) : (
                            'Paid'
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md rounded-[32px] border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-900">EDIT STUDENT</DialogTitle>
            <DialogDescription className="font-medium text-slate-500">
              Update student information and save changes.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateStudent} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-slate-400">FullName</Label>
              <Input 
                id="name" 
                value={editingStudent?.name || ''} 
                onChange={(e) => setEditingStudent(prev => prev ? { ...prev, name: e.target.value } : null)}
                className="rounded-2xl h-12 bg-slate-50 border-none focus-visible:ring-emerald-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="roll" className="text-xs font-black uppercase tracking-widest text-slate-400">Roll Number</Label>
                <Input 
                  id="roll" 
                  value={editingStudent?.roll_number || ''} 
                  onChange={(e) => setEditingStudent(prev => prev ? { ...prev, roll_number: e.target.value } : null)}
                  className="rounded-2xl h-12 bg-slate-50 border-none focus-visible:ring-emerald-500 font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="course" className="text-xs font-black uppercase tracking-widest text-slate-400">Course</Label>
                <Input 
                  id="course" 
                  value={editingStudent?.course || ''} 
                  onChange={(e) => setEditingStudent(prev => prev ? { ...prev, course: e.target.value } : null)}
                  className="rounded-2xl h-12 bg-slate-50 border-none focus-visible:ring-emerald-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Class/Batch</Label>
              <Select 
                value={editingStudent?.class_id} 
                onValueChange={(val) => setEditingStudent(prev => prev ? { ...prev, class_id: val } : null)}
              >
                <SelectTrigger className="rounded-2xl h-12 bg-slate-50 border-none focus:ring-emerald-500">
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-xl">
                  {getClassSections().map((section) => (
                    <SelectItem key={section.id} value={section.id} className="rounded-xl">
                      {section.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-4">
              <Button 
                type="submit" 
                disabled={isActionLoading}
                className="w-full h-12 rounded-2xl bg-slate-900 hover:bg-emerald-600 text-white font-bold transition-all"
              >
                {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'SAVE CHANGES'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-[32px] border-none shadow-2xl">
          <AlertDialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <AlertDialogTitle className="text-2xl font-black text-slate-900">DELETE STUDENT?</AlertDialogTitle>
            <AlertDialogDescription className="font-medium text-slate-500">
              This action cannot be undone. This will permanently delete <strong>{deletingStudent?.name}</strong> and all associated attendance records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-3">
            <AlertDialogCancel className="rounded-2xl h-12 border-slate-100 font-bold hover:bg-slate-50">CANCEL</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleDeleteStudent();
              }}
              disabled={isActionLoading}
              className="rounded-2xl h-12 bg-red-500 hover:bg-red-600 text-white font-bold border-none"
            >
              {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'DELETE PERMANENTLY'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
