import { useState, useRef, useCallback } from 'react';
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
      <div className="max-w-2xl mx-auto p-12 bg-card rounded-[40px] border border-border shadow-2xl text-center space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-slate-900">Registration Complete!</h2>
          <p className="text-slate-500 font-medium">Student {registeredStudent.name} has been successfully added to the system.</p>
        </div>

        <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
              <QRCodeSVG 
                value={JSON.stringify(registeredStudent.qr_payload)} 
                size={160}
                level="H"
                includeMargin={true}
              />
            </div>
          </div>
          <div>
            <p className="text-sm font-black text-slate-900 uppercase tracking-widest">{registeredStudent.roll_number}</p>
            <p className="text-xs text-slate-500 font-bold">{registeredStudent.course.toUpperCase()}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Button 
            onClick={downloadQRCode}
            className="h-14 rounded-2xl bg-slate-900 font-black text-lg shadow-xl flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Download QR Card
          </Button>
          <Button 
            variant="outline"
            onClick={resetForm}
            className="h-14 rounded-2xl font-black text-lg border-2 flex items-center justify-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            Add Another Student
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-8 bg-card rounded-[40px] border border-border shadow-2xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center">
          <UserPlus className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900">New Registration</h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Team Excellent Admissions</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Photo Upload / Capture Section */}
          <div className="relative group">
            <div className="flex flex-col items-center justify-center min-h-[200px] border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 hover:bg-slate-50 transition-all overflow-hidden">
              {isCameraActive ? (
                <div className="relative w-full h-full flex flex-col items-center">
                  <video ref={videoRef} autoPlay playsInline className="w-full max-h-[300px] object-cover rounded-2xl" />
                  <div className="absolute bottom-4 flex gap-2">
                    <Button type="button" onClick={capturePhoto} className="rounded-full h-12 w-12 p-0 bg-slate-900 shadow-lg">
                      <Camera className="w-6 h-6" />
                    </Button>
                    <Button type="button" variant="outline" onClick={stopCamera} className="rounded-full h-12 w-12 p-0 bg-white shadow-lg">
                      <X className="w-6 h-6" />
                    </Button>
                  </div>
                  <canvas ref={canvasRef} className="hidden" />
                </div>
              ) : filePreview ? (
                <div className="relative w-40 h-40 group/preview">
                  <img src={filePreview} alt="Preview" className="w-full h-full object-cover rounded-2xl border-2 border-white shadow-xl" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity rounded-2xl flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFilePreview(null);
                        form.setValue('photo_url', '');
                      }}
                      className="w-8 h-8 bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-rose-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="w-8 h-8 bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-slate-900 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-6 p-8">
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-white shadow-sm border border-slate-100 hover:border-slate-300 transition-all w-32"
                      disabled={isUploading}
                    >
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                        <Upload className="w-5 h-5 text-slate-500" />
                      </div>
                      <span className="text-xs font-bold text-slate-600">Upload File</span>
                    </button>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-white shadow-sm border border-slate-100 hover:border-slate-300 transition-all w-32"
                      disabled={isUploading}
                    >
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                        <Camera className="w-5 h-5 text-slate-500" />
                      </div>
                      <span className="text-xs font-bold text-slate-600">Take Photo</span>
                    </button>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Select photo source</p>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} className="rounded-xl h-12" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student Email</FormLabel>
                  <FormControl>
                    <Input placeholder="john@example.com" {...field} className="rounded-xl h-12" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="course"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="rounded-xl h-12">
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="JEE">JEE Main/Advance</SelectItem>
                      <SelectItem value="NEET">NEET UG</SelectItem>
                      <SelectItem value="CBSE">CBSE Board</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="class_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Batch/Class ID</FormLabel>
                  <FormControl>
                    <Input placeholder="JEE26TE" {...field} className="rounded-xl h-12" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="roll_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Roll Number</FormLabel>
                  <FormControl>
                    <Input placeholder="TE-001" {...field} className="rounded-xl h-12" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="parent_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent Email</FormLabel>
                  <FormControl>
                    <Input placeholder="parent@example.com" {...field} className="rounded-xl h-12" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="parent_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="9876543210" {...field} className="rounded-xl h-12" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="valid_until"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valid Until</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} className="rounded-xl h-12" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button type="submit" className="w-full h-14 rounded-2xl font-black text-lg shadow-xl" disabled={isSubmitting || isUploading || isCameraActive}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              'Register & Generate QR'
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
