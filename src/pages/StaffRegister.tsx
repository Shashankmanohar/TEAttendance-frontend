import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import { UserPlus, Mail, Lock, User, ShieldCheck } from 'lucide-react';

export default function StaffRegister() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff'
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post('/auth/register', formData);
      toast({
        title: "Registration Successful",
        description: "Staff account has been created. Please log in.",
      });
      navigate('/login');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.response?.data?.message || "Something went wrong",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 bg-slate-50/50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-none shadow-2xl shadow-purple-100/50 overflow-hidden rounded-[32px]">
          <div className="h-2 bg-[#8424bd]" />
          <CardHeader className="space-y-1 pb-8 pt-8">
            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center mb-4 mx-auto">
              <UserPlus className="w-6 h-6 text-[#8424bd]" />
            </div>
            <CardTitle className="text-2xl font-black text-center text-slate-900">Staff Registration</CardTitle>
            <CardDescription className="text-center text-slate-500 font-medium">
              Create a new account to manage your attendance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-4 top-3 w-4 h-4 text-slate-400" />
                  <Input
                    id="name"
                    placeholder="John Doe"
                    required
                    className="pl-11 h-12 bg-slate-50 border-none rounded-2xl focus-visible:ring-2 focus-visible:ring-[#8424bd]/20 transition-all font-medium"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3 w-4 h-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    required
                    className="pl-11 h-12 bg-slate-50 border-none rounded-2xl focus-visible:ring-2 focus-visible:ring-[#8424bd]/20 transition-all font-medium"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3 w-4 h-4 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    className="pl-11 h-12 bg-slate-50 border-none rounded-2xl focus-visible:ring-2 focus-visible:ring-[#8424bd]/20 transition-all font-medium"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 rounded-2xl bg-[#8424bd] hover:bg-[#701fa1] font-bold text-sm shadow-lg shadow-purple-200 transition-all active:scale-[0.98] mt-4"
                disabled={isLoading}
              >
                {isLoading ? "Creating Account..." : "Register as Staff"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pb-8 border-t border-slate-50 mt-4 pt-6">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Secure staff registration system</span>
            </div>
            <button 
              onClick={() => navigate('/login')}
              className="text-sm font-bold text-[#8424bd] hover:underline"
            >
              Already have an account? Login
            </button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
