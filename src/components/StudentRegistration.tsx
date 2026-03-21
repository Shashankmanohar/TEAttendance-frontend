import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { QRCodeSVG } from 'qrcode.react';
import QRCode from 'qrcode';
import { Loader2, CheckCircle2, UserPlus, Download, Upload, Image as ImageIcon, X, Camera, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { registerStudent, Student } from '@/lib/attendanceStore';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { toast } from 'sonner';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  course: z.string().min(1, 'Please select a course'),
  class_id: z.string().min(1, 'Class/Batch ID is required'),
  roll_number: z.string().min(1, 'Roll number is required'),
  parent_email: z.string().email('Invalid parent email'),
  parent_phone: z.string().min(10, 'Invalid phone number'),
  photo_url: z.string().url('Invalid photo URL').optional().or(z.literal('')),
  valid_until: z.string().min(1, 'Validity date is required'),
});

export function StudentRegistration() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [registeredStudent, setRegisteredStudent] = useState<Student | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      course: '',
      class_id: '',
      roll_number: '',
      parent_email: '',
      parent_phone: '',
      photo_url: '',
      valid_until: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    },
  });

  const startCamera = async () => {
    setFilePreview(null);
    try {
      // First try to get the stream to check permissions
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      
      // Then active the UI to show the video element
      setIsCameraActive(true);
      
      // Give React a small tick to render the video element
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        } else {
          // If ref still not found after tick, something is odd, stop the stream
          stream.getTracks().forEach(t => t.stop());
          setIsCameraActive(false);
          toast.error('Camera view failed to initialize');
        }
      }, 100);
    } catch (err: any) {
      console.error('Camera access error:', err);
      let msg = 'Could not access camera';
      if (err.name === 'NotAllowedError') msg = 'Camera permission denied. Please allow camera access in your browser.';
      if (err.name === 'NotFoundError') msg = 'No camera found on this device.';
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        msg = 'Camera requires a secure connection (HTTPS or localhost).';
      }
      toast.error(msg);
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
        setFilePreview(dataUrl);
        stopCamera();

        // Convert dataUrl to File and upload
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
        
        setIsUploading(true);
        try {
          const url = await uploadToCloudinary(file);
          form.setValue('photo_url', url);
          toast.success('Photo captured and uploaded');
        } catch (error) {
          toast.error('Failed to upload captured photo');
          setFilePreview(null);
        } finally {
          setIsUploading(false);
        }
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setFilePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to Cloudinary
    setIsUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      form.setValue('photo_url', url);
      toast.success('Photo uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload photo');
      setFilePreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const student = await registerStudent(values);
      setRegisteredStudent(student);
      toast.success('Student registered successfully');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error?.response?.data?.message || 'Failed to register student');
    } finally {
      setIsSubmitting(false);
    }
  }

  const downloadQRCode = async () => {
    if (!registeredStudent) return;
    const student = registeredStudent;
    const toastId = toast.loading('Generating card...');
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
      ctx.fillText(registeredStudent.name.toUpperCase(), canvas.width / 2, 60);
      
      // Roll & Course
      const roll = student.roll_number || 'N/A';
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 18px Inter, sans-serif';
      ctx.fillText(`ROLL: ${roll}`, canvas.width / 2, 100);
      ctx.fillText(`COURSE: ${student.course}`, canvas.width / 2, 130);

      // QR Code
      const qrScale = 240;
      const qrY = 160;
      const qrData = JSON.stringify(student.qr_payload);
      
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
      
      toast.success('QR Card downloaded', { id: toastId });
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to generate card', { id: toastId });
    }
  };

  const resetForm = () => {
    setRegisteredStudent(null);
    setFilePreview(null);
    form.reset({
      name: '',
      email: '',
      course: '',
      class_id: '',
      roll_number: '',
      parent_email: '',
      parent_phone: '',
      photo_url: '',
      valid_until: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    });
  };

  if (registeredStudent) {
    return (
      <div className="max-w-2xl mx-auto p-12 bg-white/40 backdrop-blur-3xl rounded-[48px] border border-white shadow-2xl text-center space-y-10 animate-in fade-in zoom-in duration-700 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-[#8424bd]/10 blur-3xl rounded-full -mr-20 -mt-20" />
        
        <div className="flex justify-center relative z-10">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 12, stiffness: 200 }}
            className="w-28 h-28 rounded-[36px] bg-emerald-500 shadow-xl shadow-emerald-200 flex items-center justify-center border-4 border-white"
          >
            <CheckCircle2 className="w-14 h-14 text-white" />
          </motion.div>
        </div>
        
        <div className="space-y-3 relative z-10">
          <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none">REGISTRATION <span className="text-[#8424bd]">SUCCESS</span></h2>
          <p className="text-slate-500 font-bold text-lg uppercase tracking-tight">System Identity Provisioned</p>
        </div>

        <div className="bg-white/60 backdrop-blur-xl rounded-[40px] p-10 border border-white shadow-xl shadow-slate-200/40 space-y-6 group relative z-10 hover:-translate-y-1 transition-transform duration-500">
           {registeredStudent.photo_url && (
             <div className="flex justify-center mb-6">
               <img src={registeredStudent.photo_url} className="w-32 h-32 rounded-[32px] object-cover border-4 border-white shadow-lg" alt="" />
             </div>
           )}
          <div className="flex justify-center">
            <div className="p-6 bg-white rounded-[32px] shadow-sm border border-slate-100 group-hover:scale-105 transition-transform duration-500">
              <QRCodeSVG 
                value={JSON.stringify(registeredStudent.qr_payload)} 
                size={180}
                level="H"
                includeMargin={true}
              />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xl font-black text-slate-900 tracking-tight uppercase leading-none">{registeredStudent.name}</p>
            <div className="flex items-center justify-center gap-2">
               <span className="text-xs font-black text-[#8424bd] bg-purple-50 px-3 py-1 rounded-full uppercase tracking-widest">{registeredStudent.roll_number}</span>
               <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{registeredStudent.course}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 relative z-10">
          <Button 
            onClick={downloadQRCode}
            className="h-16 rounded-[24px] bg-slate-900 hover:bg-[#8424bd] text-white font-black text-xs tracking-widest uppercase shadow-2xl shadow-slate-200 transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            <Download className="w-5 h-5" />
            Download QR Card
          </Button>
          <Button 
            variant="outline"
            onClick={resetForm}
            className="h-16 rounded-[24px] bg-white border-2 border-slate-100 font-black text-xs tracking-widest uppercase shadow-xl hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            <UserPlus className="w-5 h-5 text-[#8424bd]" />
            Add Another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-10 bg-white/40 backdrop-blur-3xl rounded-[48px] border border-white shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-32 h-32 bg-[#8424bd]/5 blur-3xl rounded-full -ml-16 -mt-16" />
      
      <div className="flex items-center gap-5 mb-10 relative z-10">
        <div className="w-16 h-16 rounded-[24px] bg-[#8424bd] shadow-xl shadow-purple-200 flex items-center justify-center text-white">
          <UserPlus className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">ENROLL <span className="text-[#8424bd]">STUDENT</span></h2>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">Initialize Identity Management protocol</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 relative z-10">
          {/* Photo Upload / Capture Section */}
          <div className="relative group">
            <div className="flex flex-col items-center justify-center min-h-[240px] border-2 border-dashed border-slate-200 rounded-[40px] bg-white/60 backdrop-blur-md hover:bg-white/80 transition-all overflow-hidden shadow-inner cursor-default group-hover:border-[#8424bd]/30">
              {isCameraActive ? (
                <div className="relative w-full h-full flex flex-col items-center">
                  <motion.video 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full max-h-[400px] object-cover rounded-[32px] shadow-2xl border-4 border-white" 
                  />
                  <div className="absolute bottom-6 flex gap-4">
                    <Button type="button" onClick={capturePhoto} className="h-14 w-14 rounded-2xl p-0 bg-[#8424bd] hover:bg-[#6c1d9b] shadow-2xl shadow-purple-300">
                      <Camera className="w-7 h-7" />
                    </Button>
                    <Button type="button" variant="outline" onClick={stopCamera} className="h-14 w-14 rounded-2xl p-0 bg-white shadow-2xl border-white hover:bg-slate-50">
                      <X className="w-7 h-7 text-red-500" />
                    </Button>
                  </div>
                  <canvas ref={canvasRef} className="hidden" />
                </div>
              ) : filePreview ? (
                <div className="relative w-48 h-48 group/preview">
                  <motion.img 
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    src={filePreview} 
                    alt="Preview" 
                    className="w-full h-full object-cover rounded-[32px] border-4 border-white shadow-2xl ring-8 ring-[#8424bd]/5" 
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/preview:opacity-100 transition-opacity rounded-[32px] flex items-center justify-center gap-3 backdrop-blur-sm">
                    <button
                      type="button"
                      onClick={() => {
                        setFilePreview(null);
                        form.setValue('photo_url', '');
                      }}
                      className="w-10 h-10 bg-white/20 backdrop-blur-md text-white rounded-2xl flex items-center justify-center hover:bg-rose-500 transition-all hover:scale-110"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="w-10 h-10 bg-white/20 backdrop-blur-md text-white rounded-2xl flex items-center justify-center hover:bg-[#8424bd] transition-all hover:scale-110"
                    >
                      <RefreshCw className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-8 p-10">
                  <div className="flex gap-6">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="group/btn flex flex-col items-center gap-4 p-6 rounded-[32px] bg-white shadow-xl shadow-slate-200/40 border border-slate-100 hover:border-[#8424bd]/40 transition-all w-36 hover:-translate-y-1"
                      disabled={isUploading}
                    >
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center group-hover/btn:bg-purple-50 transition-colors">
                        <Upload className="w-6 h-6 text-slate-400 group-hover/btn:text-[#8424bd]" />
                      </div>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Browse Storage</span>
                    </button>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="group/btn flex flex-col items-center gap-4 p-6 rounded-[32px] bg-white shadow-xl shadow-slate-200/40 border border-slate-100 hover:border-[#8424bd]/40 transition-all w-36 hover:-translate-y-1"
                      disabled={isUploading}
                    >
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center group-hover/btn:bg-purple-50 transition-colors">
                        <Camera className="w-6 h-6 text-slate-400 group-hover/btn:text-[#8424bd]" />
                      </div>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Capture LIVE</span>
                    </button>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">AUTHENTIC STUDENT PHOTO REQUIRED</p>
                  </div>
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 bg-white/40 p-1 rounded-[32px]">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Full Identity Name</FormLabel>
                  <FormControl>
                    <Input placeholder="E.g. Alexander Hamilton" {...field} className="rounded-[20px] h-14 bg-white/80 border-slate-100 focus:ring-4 focus:ring-purple-50 font-bold px-6" />
                  </FormControl>
                  <FormMessage className="ml-4" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Primary Email Address</FormLabel>
                  <FormControl>
                    <Input placeholder="student@excellent.edu" {...field} className="rounded-[20px] h-14 bg-white/80 border-slate-100 focus:ring-4 focus:ring-purple-50 font-bold px-6" />
                  </FormControl>
                  <FormMessage className="ml-4" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="course"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Academic stream</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="rounded-[20px] h-14 bg-white/80 border-slate-100 focus:ring-4 focus:ring-purple-50 font-bold px-6">
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                      <SelectItem value="JEE" className="focus:bg-[#8424bd] focus:text-white rounded-xl">JEE Main/Advance</SelectItem>
                      <SelectItem value="NEET" className="focus:bg-[#8424bd] focus:text-white rounded-xl">NEET UG</SelectItem>
                      <SelectItem value="CBSE" className="focus:bg-[#8424bd] focus:text-white rounded-xl">CBSE Board</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="ml-4" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="class_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Assigned Batch ID</FormLabel>
                  <FormControl>
                    <Input placeholder="JEE26-B1" {...field} className="rounded-[20px] h-14 bg-white/80 border-slate-100 focus:ring-4 focus:ring-purple-50 font-bold px-6" />
                  </FormControl>
                  <FormMessage className="ml-4" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="roll_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Unique Roll Number</FormLabel>
                  <FormControl>
                    <Input placeholder="TE-XXXX" {...field} className="rounded-[20px] h-14 bg-white/80 border-slate-100 focus:ring-4 focus:ring-purple-50 font-bold px-6 uppercase" />
                  </FormControl>
                  <FormMessage className="ml-4" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="parent_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Guardian Contact Email</FormLabel>
                  <FormControl>
                    <Input placeholder="parent@home.com" {...field} className="rounded-[20px] h-14 bg-white/80 border-slate-100 focus:ring-4 focus:ring-purple-50 font-bold px-6" />
                  </FormControl>
                  <FormMessage className="ml-4" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="parent_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Guardian Mobile Number</FormLabel>
                  <FormControl>
                    <Input placeholder="+91 0000 000000" {...field} className="rounded-[20px] h-14 bg-white/80 border-slate-100 focus:ring-4 focus:ring-purple-50 font-bold px-6" />
                  </FormControl>
                  <FormMessage className="ml-4" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="valid_until"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Identity expiration Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} className="rounded-[20px] h-14 bg-white/80 border-slate-100 focus:ring-4 focus:ring-purple-50 font-bold px-6 uppercase" />
                  </FormControl>
                  <FormMessage className="ml-4" />
                </FormItem>
              )}
            />
          </div>

          <Button type="submit" className="w-full h-18 rounded-[28px] bg-slate-900 hover:bg-[#8424bd] text-white font-black text-sm tracking-[0.2em] uppercase shadow-2xl shadow-slate-300 hover:shadow-purple-300 transition-all duration-500 active:scale-95 group overflow-hidden" disabled={isSubmitting || isUploading || isCameraActive}>
            {isSubmitting ? (
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin" />
                COMMITTING TO BLOCKCHAIN...
              </div>
            ) : (
              <div className="flex items-center gap-3 relative z-10">
                 FINALIZE REGISTRATION
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          </Button>
        </form>
      </Form>
    </div>
  );
}
