import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { QrCode, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  
  const { login, token, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (token && user) {
      if (user.role === 'admin') navigate('/dashboard');
      else if (user.role === 'staff') navigate('/staff/dashboard');
      else navigate('/dashboard'); // Students or others
    }
  }, [token, user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitLoading(true);
    try {
      const response = await api.post('auth/login', { email, password });
      console.log('Login successful, user data:', response.data.user);
      login(response.data.token, response.data.user);
      
      toast({
        title: "Access Authorized",
        description: `Welcome back, ${response.data.user.name}`,
      });
      
      // Navigation handled by useEffect
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: error.response?.data?.message || "Invalid credentials",
      });
    } finally {
      setIsSubmitLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex flex-col items-center justify-center relative overflow-hidden font-sans selection:bg-[#8424bd]/30 selection:text-white">
      {/* Abstract Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#8424bd]/10 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/5 blur-[120px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[440px] px-6 relative z-10"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[28px] bg-gradient-to-br from-[#8424bd] to-[#5e188e] shadow-[0_20px_40px_rgba(132,36,189,0.3)] mb-8 transform hover:scale-105 transition-transform duration-500">
            <QrCode className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-2 uppercase">
            TEAM <span className="text-[#8424bd]">EXCELLENT</span>
          </h1>
          <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-[10px]">Universal Identity Portal</p>
        </div>

        <div className="space-y-6">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Email Address</Label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-[#8424bd] transition-colors" />
                <Input
                  type="email"
                  placeholder="name@excellent.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-14 h-16 rounded-[20px] bg-white/5 border border-white/10 focus:border-[#8424bd] focus:ring-[#8424bd]/20 text-white font-bold placeholder:text-white/20 transition-all duration-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <Label className="text-[10px] font-black uppercase tracking-widest text-white/40">Password</Label>
                <button type="button" className="text-[10px] font-black uppercase tracking-widest text-[#8424bd] hover:text-[#721fac] transition-colors">Forgot Password?</button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-[#8424bd] transition-colors" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-14 pr-14 h-16 rounded-[20px] bg-white/5 border border-white/10 focus:border-[#8424bd] focus:ring-[#8424bd]/20 text-white font-bold placeholder:text-white/20 transition-all duration-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitLoading}
              className="w-full h-18 rounded-[24px] bg-[#8424bd] hover:bg-[#721fac] text-white font-black text-sm uppercase tracking-[0.2em] shadow-[0_20px_40px_rgba(132,36,189,0.15)] transition-all active:scale-[0.98] mt-4"
            >
              {isSubmitLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                "Sign In to Portal"
              )}
            </Button>
          </form>
        </div>

        <p className="text-center mt-12 text-white/20 text-[10px] font-black uppercase tracking-[0.4em]">
          Institutional Security Framework v2.0
        </p>
      </motion.div>
    </div>
  );
};

export default Index;
