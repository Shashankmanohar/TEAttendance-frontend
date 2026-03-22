import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, addMonths, subMonths } from 'date-fns';
import api, { staffApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Mail, Calendar, ChevronRight, Search, User, ArrowLeft, UserPlus, Image as ImageIcon, Loader2, QrCode, Trash2, Edit, Download, Eye, EyeOff, ShieldCheck, UserCheck, Camera, X as XIcon, RefreshCw, Upload, ChevronLeft, Calendar as CalendarIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import AttendanceCalendar from '../components/AttendanceCalendar';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { QRCodeSVG } from 'qrcode.react';
import QRCode from 'qrcode';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function AdminStaffManagement() {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [viewDate, setViewDate] = useState(new Date());
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', email: '', password: '', role: 'staff', photo_url: '' });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    console.log('AdminStaffManagement viewDate changed:', viewDate);
    fetchStaff();
  }, [viewDate]);

  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      const monthParam = format(viewDate, 'yyyy-MM');
      console.log('Fetching staff with month:', monthParam);
      const response = await staffApi.getAllStaff(monthParam);
      console.log('Staff fetch successful:', response.data.length, 'members');
      setStaffList(response.data);
    } catch (error: any) {
      console.error('Error fetching staff Details:', error.response?.data || error.message);
      console.error('Stack:', error.stack);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load staff members",
      });
    } finally {
      setIsLoading(true); // Should stay true or false? usually false when done
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [viewDate]);

  const handlePrevMonth = () => setViewDate(prev => subMonths(prev, 1));
  const handleNextMonth = () => setViewDate(prev => addMonths(prev, 1));

  const handleRegisterStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistering(true);
    try {
      await api.post('/auth/register', newStaff);
      toast({
        title: "Staff Registered",
        description: `${newStaff.name} has been successfully registered.`,
      });
      setIsDialogOpen(false);
      setNewStaff({ name: '', email: '', password: '', role: 'staff', photo_url: '' });
      fetchStaff();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.response?.data?.message || "Something went wrong",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setIsCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        } else {
          stream.getTracks().forEach(t => t.stop());
          setIsCameraActive(false);
          toast({ variant: "destructive", title: "Error", description: "Camera view failed to initialize" });
        }
      }, 100);
    } catch (err: any) {
      console.error('Camera access error:', err);
      let msg = 'Could not access camera';
      if (err.name === 'NotAllowedError') msg = 'Camera permission denied. Please allow camera access in your browser.';
      if (err.name === 'NotFoundError') msg = 'No camera found on this device.';
      toast({ variant: "destructive", title: "Camera Error", description: msg });
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setIsCameraActive(false);
  };

  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        stopCamera();

        setIsUploading(true);
        try {
          const res = await fetch(dataUrl);
          const blob = await res.blob();
          const file = new File([blob], 'staff_capture.jpg', { type: 'image/jpeg' });
          const url = await uploadToCloudinary(file);
          setNewStaff(prev => ({ ...prev, photo_url: url }));
          toast({ title: "Authorized", description: "Live photo captured and linked" });
        } catch (error) {
          toast({ variant: "destructive", title: "Capture Failed", description: "Failed to upload captured photo" });
        } finally {
          setIsUploading(false);
        }
      }
    }
  };

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    setIsRegistering(true);
    try {
      await staffApi.updateStaff(editingStaff._id, editingStaff);
      toast({
        title: "Staff Updated",
        description: `${editingStaff.name}'s profile has been updated.`,
      });
      setIsEditOpen(false);
      setEditingStaff(null);
      fetchStaff();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.response?.data?.message || "Something went wrong",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleDeleteStaff = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This will also remove all their attendance records.`)) return;
    try {
      await staffApi.deleteStaff(id);
      toast({
        title: "Staff Deleted",
        description: "Staff member removed from system",
      });
      fetchStaff();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: "Could not remove staff member",
      });
    }
  };

  const downloadStaffQR = async (staff: any) => {
    const toastId = toast({ title: "Generating QR Card...", description: "Please wait" });
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = 400;
      canvas.height = 450;

      // Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Info
      ctx.fillStyle = '#1e293b';
      ctx.textAlign = 'center';
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText(staff.name.toUpperCase(), canvas.width / 2, 60);
      
      ctx.fillStyle = '#8424bd';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(`STAFF ID: ${staff.staff_id || 'N/A'}`, canvas.width / 2, 95);

      // QR Code
      const qrData = JSON.stringify({ staff_id: staff.staff_id, name: staff.name, type: 'staff' });
      const qrScale = 240;
      const qrCanvas = document.createElement('canvas');
      await QRCode.toCanvas(qrCanvas, qrData, {
        margin: 1,
        width: qrScale,
        errorCorrectionLevel: 'H'
      });
      
      ctx.drawImage(qrCanvas, canvas.width / 2 - qrScale / 2, 130, qrScale, qrScale);

      // Footer
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText("TEAM EXCELLENT STAFF IDENTITY", canvas.width / 2, 410);

      const link = document.createElement('a');
      link.download = `staff-qr-${staff.name.replace(/\s+/g, '-').toLowerCase()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast({ title: "QR Card Downloaded", description: "Identity card is ready" });
    } catch (error) {
      console.error('QR Download error:', error);
      toast({ variant: "destructive", title: "Download Failed", description: "Failed to generate QR card" });
    }
  };

  const handleViewAttendance = async (staff: any) => {
    setIsLoading(true);
    try {
      const response = await staffApi.getStaffAttendance(staff._id);
      setAttendanceRecords(response.data);
      setSelectedStaff(staff);
    } catch (error) {
      console.error('Failed to fetch attendance', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load attendance records",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStaff = staffList.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.staff_id && s.staff_id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="page-container w-full space-y-10 animate-in fade-in zoom-in duration-700">
      <div className="space-y-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <p className="page-subtitle">Administrative Control</p>
                <h1 className="page-title">Staff <span className="premium-text-gradient">Directory</span></h1>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto items-center">
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

                <div className="flex flex-wrap gap-4 w-full sm:w-auto items-center">
                  <div className="relative group w-full sm:w-80 flex items-center">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#8424bd] transition-colors z-10" />
                    <Input 
                      placeholder="Search staff records..." 
                      className="pl-14 rounded-full h-14 border-none bg-white shadow-lg shadow-slate-200/50 focus-visible:ring-2 focus-visible:ring-purple-100 transition-all font-medium text-slate-600"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="h-14 px-10 rounded-full bg-[#8424bd] hover:bg-[#701fa1] font-black text-[11px] tracking-[0.15em] uppercase shadow-lg shadow-purple-200 flex items-center gap-3 active:scale-95 transition-all">
                        <UserPlus className="w-5 h-5" />
                        Add New Member
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] rounded-[40px] border-none shadow-2xl p-0 overflow-hidden bg-white">
                      <div className="h-32 bg-gradient-to-br from-[#8424bd] to-[#5e188e] flex items-center px-10 relative overflow-hidden">
                         <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                         <div className="z-10 text-white flex-1">
                           <h2 className="text-2xl font-black tracking-tight">Staff Registration</h2>
                           <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Create Identity Record</p>
                         </div>
                         <DialogClose className="z-20 w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">
                           <XIcon className="w-5 h-5 text-white" />
                         </DialogClose>
                      </div>
                      <form onSubmit={handleRegisterStaff} className="p-10 space-y-6">
                        <div className="flex flex-col items-center gap-6 mb-4">
                          <div className="relative w-full min-h-[200px] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[32px] bg-slate-50/50 overflow-hidden group hover:border-[#8424bd]/30 transition-all">
                            {isCameraActive ? (
                              <div className="relative w-full h-full flex flex-col items-center">
                                <video 
                                  ref={videoRef} 
                                  autoPlay 
                                  playsInline 
                                  className="w-full h-48 object-cover rounded-2xl" 
                                />
                                <div className="absolute bottom-4 flex gap-3">
                                  <Button type="button" onClick={capturePhoto} className="h-12 w-12 rounded-xl p-0 bg-[#8424bd] hover:bg-[#701fa1] shadow-xl">
                                    <Camera className="w-6 h-6" />
                                  </Button>
                                  <Button type="button" variant="outline" onClick={stopCamera} className="h-12 w-12 rounded-xl p-0 bg-white border-white hover:bg-slate-50 shadow-xl">
                                    <XIcon className="w-6 h-6 text-rose-500" />
                                  </Button>
                                </div>
                                <canvas ref={canvasRef} className="hidden" />
                              </div>
                            ) : newStaff.photo_url ? (
                              <div className="relative w-32 h-32 group/preview">
                                <img src={newStaff.photo_url} className="w-full h-full object-cover rounded-[32px] border-4 border-white shadow-xl" alt="Preview" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-all rounded-[32px] flex items-center justify-center gap-2 backdrop-blur-[2px]">
                                  <button
                                    type="button"
                                    onClick={() => setNewStaff({ ...newStaff, photo_url: '' })}
                                    className="w-9 h-9 bg-white/20 text-white rounded-xl flex items-center justify-center hover:bg-rose-500 transition-all"
                                  >
                                    <XIcon className="w-5 h-5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={startCamera}
                                    className="w-9 h-9 bg-white/20 text-white rounded-xl flex items-center justify-center hover:bg-[#8424bd] transition-all"
                                  >
                                    <RefreshCw className="w-5 h-5" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex gap-4 p-6">
                                <button
                                  type="button"
                                  onClick={() => fileInputRef.current?.click()}
                                  className="flex flex-col items-center gap-3 p-5 rounded-[24px] bg-white shadow-sm border border-slate-100 hover:border-[#8424bd]/30 transition-all w-28 hover:-translate-y-1"
                                >
                                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                                    <Upload className="w-5 h-5 text-slate-400" />
                                  </div>
                                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">Browse</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={startCamera}
                                  className="flex flex-col items-center gap-3 p-5 rounded-[24px] bg-white shadow-sm border border-slate-100 hover:border-[#8424bd]/30 transition-all w-28 hover:-translate-y-1"
                                >
                                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                                    <Camera className="w-5 h-5 text-slate-400" />
                                  </div>
                                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">Capture</span>
                                </button>
                              </div>
                            )}
                          </div>
                          <input 
                            type="file" 
                            ref={fileInputRef} 
                            accept="image/*" 
                            className="hidden" 
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setIsUploading(true);
                                try {
                                  const response = await uploadToCloudinary(file);
                                  setNewStaff(prev => ({ ...prev, photo_url: response }));
                                  toast({ title: "Authorized", description: "Profile photo linked successfully" });
                                } catch (error) {
                                  toast({ variant: "destructive", title: "Upload Failed", description: "Storage service error" });
                                } finally {
                                  setIsUploading(false);
                                }
                              }
                            }} 
                          />
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-[.15em] text-slate-400 ml-1">Legal Full Name</Label>
                            <Input
                              placeholder="e.g. Michael Chen"
                              className="h-14 bg-slate-50 border-none rounded-2xl focus-visible:ring-2 focus-visible:ring-purple-100 font-bold text-slate-900"
                              value={newStaff.name}
                              onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                              required
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-[.15em] text-slate-400 ml-1">Official Email</Label>
                            <Input
                              type="email"
                              placeholder="staff@excellent.edu"
                              className="h-14 bg-slate-50 border-none rounded-2xl focus-visible:ring-2 focus-visible:ring-purple-100 font-bold text-slate-900"
                              value={newStaff.email}
                              onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                              required
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-[.15em] text-slate-400 ml-1">Access Password</Label>
                            <div className="relative group/pass">
                              <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="Secure Passphrase"
                                className="h-14 bg-slate-50 border-none rounded-2xl focus-visible:ring-2 focus-visible:ring-purple-100 font-bold text-slate-900 pr-12"
                                value={newStaff.password}
                                onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                                required
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#8424bd] transition-colors"
                              >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                              </button>
                            </div>
                          </div>
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full h-14 rounded-2xl bg-[#8424bd] hover:bg-[#701fa1] font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-purple-100 transition-all mt-4"
                          disabled={isRegistering || isUploading}
                        >
                          {isRegistering ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Registration"}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {filteredStaff.length > 0 ? (
                filteredStaff.map((staff, i) => (
                  <motion.div
                    key={staff._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group relative bg-white/70 backdrop-blur-xl rounded-[32px] sm:rounded-[40px] border border-white/40 shadow-2xl shadow-slate-200/40 p-6 sm:p-8 hover:shadow-purple-100/50 transition-all duration-500 hover:-translate-y-2 overflow-hidden"
                  >
                    {/* Background Decorative Accent */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#8424bd]/5 rounded-bl-[100px] -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700 pointer-events-none" />

                    <div className="flex items-start justify-between mb-8 relative z-10">
                      <div className="relative">
                        <div className="w-24 h-24 rounded-[32px] bg-white overflow-hidden border-2 border-slate-50 shadow-xl ring-8 ring-slate-50/50 transition-transform group-hover:scale-105 duration-500">
                          {staff.photo_url ? (
                            <img src={staff.photo_url} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                               <User className="w-10 h-10 text-slate-200" />
                            </div>
                          )}
                        </div>
                        <div className={cn(
                          "absolute -bottom-2 -right-2 w-8 h-8 rounded-full border-4 border-white shadow-lg flex items-center justify-center",
                          staff.role === 'admin' ? "bg-[#8424bd]" : "bg-emerald-500"
                        )}>
                          {staff.role === 'admin' ? <ShieldCheck className="w-4 h-4 text-white" /> : <UserCheck className="w-4 h-4 text-white" />}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-500">
                         <Button 
                          variant="secondary" size="icon" className="w-10 h-10 rounded-2xl bg-white shadow-lg border-none text-slate-500 hover:text-[#8424bd] hover:scale-110 transition-all"
                          onClick={() => { setEditingStaff(staff); setIsEditOpen(true); }}
                        >
                          <Edit className="w-4.5 h-4.5" />
                        </Button>
                        <Button 
                          variant="secondary" size="icon" className="w-10 h-10 rounded-2xl bg-white shadow-lg border-none text-slate-500 hover:text-rose-500 hover:scale-110 transition-all"
                          onClick={() => handleDeleteStaff(staff._id, staff.name)}
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-6 relative z-10">
                      <div>
                        <h3 className="font-black text-2xl text-slate-900 tracking-tight mb-1 group-hover:text-[#8424bd] transition-colors">{staff.name}</h3>
                        <div className="flex items-center gap-2">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">{staff.role || 'Personnel'}</p>
                           {staff.monthlyPresenceCount !== undefined && (
                              <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg uppercase tracking-wider">{staff.monthlyPresenceCount} Days in {format(viewDate, 'MMM')}</span>
                           )}
                           {staff.totalPresenceCount !== undefined && (
                              <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg uppercase tracking-wider">{staff.totalPresenceCount} Total Days</span>
                           )}
                        </div>
                      </div>

                      <div className="space-y-4 py-6 border-y border-slate-50">
                        <div className="flex items-center gap-4 text-slate-600">
                           <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center">
                             <Mail className="w-5 h-5 text-[#8424bd]" />
                           </div>
                           <div className="overflow-hidden translate-y-0.5">
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Official Reach</p>
                             <p className="font-bold text-sm truncate">{staff.email}</p>
                           </div>
                        </div>

                        <div className="flex items-center gap-4 text-slate-600">
                           <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center">
                             <QrCode className="w-5 h-5 text-[#8424bd]" />
                           </div>
                           <div className="translate-y-0.5">
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">System Identifier</p>
                             <p className="font-mono font-black text-sm tracking-wider">{staff.staff_id || 'Generating...'}</p>
                           </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <Button 
                          onClick={() => handleViewAttendance(staff)}
                          className="flex-1 h-14 rounded-2xl bg-slate-900 hover:bg-[#8424bd] text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-slate-200 transition-all active:scale-95 flex items-center justify-center gap-3"
                        >
                          Registry View
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => downloadStaffQR(staff)}
                          className="w-14 h-14 rounded-2xl border-slate-100 text-slate-500 hover:text-emerald-500 hover:border-emerald-100 hover:bg-emerald-50/50 transition-all flex items-center justify-center"
                        >
                          <Download className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full py-32 text-center bg-white/50 backdrop-blur-sm rounded-[40px] border border-dashed border-slate-200">
                   <div className="flex flex-col items-center max-w-sm mx-auto">
                      <div className="w-24 h-24 bg-slate-50 rounded-[32px] flex items-center justify-center mb-8 shadow-inner">
                         <Users className="w-12 h-12 text-slate-200" />
                      </div>
                      <h3 className="text-xl font-black text-slate-900 mb-2">Registry is Clear</h3>
                      <p className="text-sm text-slate-400 font-medium">
                        {searchTerm 
                          ? `No staff members were detected matching "${searchTerm}" in our system.` 
                          : "Your administrative personnel directory is currently empty. Start by adding a new member."}
                      </p>
                      {searchTerm && (
                        <Button 
                          variant="link" 
                          onClick={() => setSearchTerm('')}
                          className="mt-4 text-[#8424bd] font-bold uppercase tracking-widest text-[10px]"
                        >
                          Clear Search Filter
                        </Button>
                      )}
                   </div>
                </div>
              )}
            </div>

            {/* Edit Staff Dialog - Premium Update */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogContent className="sm:max-w-[425px] rounded-[40px] border-none shadow-2xl p-0 overflow-hidden bg-white">
                <div className="h-32 bg-gradient-to-br from-[#8424bd] to-[#5e188e] flex items-center px-10 relative overflow-hidden">
                   <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                   <div className="z-10 text-white flex-1">
                     <h2 className="text-2xl font-black tracking-tight">Identity Update</h2>
                     <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Refine Permanent Records</p>
                   </div>
                   <DialogClose className="z-20 w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">
                     <XIcon className="w-5 h-5 text-white" />
                   </DialogClose>
                </div>
                {editingStaff && (
                  <form onSubmit={handleUpdateStaff} className="p-10 space-y-6">
                    <div className="flex flex-col items-center gap-4 mb-2">
                       <div 
                        className="relative w-28 h-28 rounded-[28px] bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer hover:border-[#8424bd]/30 transition-all overflow-hidden shadow-sm group"
                        onClick={() => document.getElementById('edit-staff-photo-input')?.click()}
                      >
                        {editingStaff.photo_url ? (
                          <img src={editingStaff.photo_url} className="w-full h-full object-cover" alt="Preview" />
                        ) : (
                          <div className="flex flex-col items-center text-slate-400 group-hover:text-[#8424bd] transition-colors">
                            <ImageIcon className="w-8 h-8 mb-2" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Update Photo</span>
                          </div>
                        )}
                        {isUploading && (
                          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-[#8424bd]" />
                          </div>
                        )}
                      </div>
                      <input id="edit-staff-photo-input" type="file" accept="image/*" className="hidden" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setIsUploading(true);
                          try {
                            const response = await uploadToCloudinary(file);
                            setEditingStaff({ ...editingStaff, photo_url: response });
                            toast({ title: "Authorized", description: "Identity portrait updated" });
                          } catch (error) {
                            toast({ variant: "destructive", title: "Update Failed", description: "Storage system error" });
                          } finally {
                            setIsUploading(false);
                          }
                        }
                      }} />
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-[.15em] text-slate-400 ml-1">Member Name</Label>
                        <Input
                          className="h-14 bg-slate-50 border-none rounded-2xl focus-visible:ring-2 focus-visible:ring-purple-100 font-bold text-slate-900"
                          value={editingStaff.name}
                          onChange={(e) => setEditingStaff({ ...editingStaff, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-[.15em] text-slate-400 ml-1">Communication Email</Label>
                        <Input
                          type="email"
                          className="h-14 bg-slate-50 border-none rounded-2xl focus-visible:ring-2 focus-visible:ring-purple-100 font-bold text-slate-900"
                          value={editingStaff.email}
                          onChange={(e) => setEditingStaff({ ...editingStaff, email: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-[.15em] text-slate-400 ml-1">New Security Phrase <span className="text-slate-300 font-medium">(Optional)</span></Label>
                        <div className="relative group/pass">
                          <Input
                            type={showEditPassword ? "text" : "password"}
                            placeholder="Leave vacant to maintain current"
                            className="h-14 bg-slate-50 border-none rounded-2xl focus-visible:ring-2 focus-visible:ring-purple-100 font-bold text-slate-900 pr-12"
                            onChange={(e) => setEditingStaff({ ...editingStaff, password: e.target.value })}
                          />
                          <button
                            type="button"
                            onClick={() => setShowEditPassword(!showEditPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#8424bd] transition-colors"
                          >
                            {showEditPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full h-14 rounded-2xl bg-[#8424bd] hover:bg-[#701fa1] font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-purple-100 transition-all mt-4"
                      disabled={isRegistering || isUploading}
                    >
                      {isRegistering ? <Loader2 className="w-4 h-4 animate-spin" /> : "Commit Modifications"}
                    </Button>
                  </form>
                )}
              </DialogContent>
            </Dialog>
      </div>

      {/* Staff Detail / Registry Dialog */}
      <Dialog open={!!selectedStaff} onOpenChange={(open) => !open && setSelectedStaff(null)}>
        <DialogContent className="max-w-4xl rounded-[40px] border-none shadow-2xl p-0 overflow-hidden bg-white max-h-[90vh] flex flex-col">
          {selectedStaff && (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Premium Header */}
              <div className="h-40 bg-gradient-to-br from-[#8424bd] to-[#5e188e] p-8 relative overflow-hidden shrink-0">
                 <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
                 <div className="relative z-10 flex items-center justify-between">
                   <div className="flex items-center gap-6">
                      <div className="w-24 h-24 rounded-[32px] bg-white border-4 border-white overflow-hidden shadow-2xl">
                        {selectedStaff.photo_url ? (
                          <img src={selectedStaff.photo_url} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-200">
                            <User className="w-12 h-12" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h2 className="text-3xl font-black text-white tracking-tight uppercase italic">{selectedStaff.name}</h2>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black text-white uppercase tracking-widest border border-white/20">
                            {selectedStaff.role || 'Staff Member'}
                          </span>
                          <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black text-white uppercase tracking-widest border border-white/20">
                            {selectedStaff.email}
                          </span>
                        </div>
                      </div>
                   </div>
                   
                   <Button 
                      onClick={() => downloadStaffQR(selectedStaff)}
                      className="h-12 px-6 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-black text-[10px] tracking-widest uppercase backdrop-blur-md border border-white/20 flex items-center gap-2 transition-all"
                    >
                      <Download className="w-4 h-4" />
                      ID CARD
                    </Button>
                 </div>
              </div>
              
              <div className="p-8 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-6 rounded-[32px] bg-emerald-50 border border-emerald-100">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-2 text-center">Monthly Attendance</p>
                    <p className="text-4xl font-black text-emerald-700 text-center tracking-tighter">
                      {selectedStaff.monthlyPresenceCount || 0}
                      <span className="text-sm ml-1 opacity-60">DAYS</span>
                    </p>
                    <p className="text-[9px] font-black text-emerald-600/60 uppercase tracking-widest text-center mt-2 italic">IN {format(viewDate, 'MMMM yyyy')}</p>
                  </div>
                  <div className="p-6 rounded-[32px] bg-blue-50 border border-blue-100">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2 text-center">Lifetime Presence</p>
                    <p className="text-4xl font-black text-blue-700 text-center tracking-tighter">
                      {selectedStaff.totalPresenceCount || 0}
                      <span className="text-sm ml-1 opacity-60">DAYS</span>
                    </p>
                    <p className="text-[9px] font-black text-blue-600/60 uppercase tracking-widest text-center mt-2 italic">SINCE REGISTRATION</p>
                  </div>
                </div>

                {/* Calendar View */}
                <div className="bg-slate-50/50 rounded-[40px] p-6 border border-slate-100">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 pl-2">Attendance Log Calendar</p>
                   <AttendanceCalendar 
                    records={attendanceRecords} 
                    currentDate={calendarDate}
                    setCurrentDate={setCalendarDate}
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={() => setSelectedStaff(null)}
                    className="h-14 px-10 rounded-2xl bg-slate-900 text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:bg-[#8424bd] transition-all"
                  >
                    Dismiss Registry
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
