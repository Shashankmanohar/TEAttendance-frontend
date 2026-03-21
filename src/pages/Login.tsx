import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent, CardDescription, CardFooter, CardTitle } from '@/components/ui/card';
import { QrCode, Lock, Mail, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const { login, token, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  React.useEffect(() => {
    if (!isAuthLoading && token) {
      navigate('/dashboard');
    }
  }, [token, isAuthLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitLoading(true);
    try {
      const response = await api.post('auth/login', { email, password });
      login(response.data.token, response.data.user);
      toast({
        title: "Welcome back!",
        description: `Logged in as ${response.data.user.name}`,
      });
      // Redirect happens via useEffect
    } catch (error: any) {
      console.error('Login failed:', error);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.response?.data?.message || "Invalid credentials",
      });
    } finally {
      setIsSubmitLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50/50 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-[#8424bd]/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl animate-pulse delay-700" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md px-4 z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-[#8424bd] shadow-2xl shadow-purple-200 mb-6">
            <QrCode className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
            TEAM <span className="text-[#8424bd]">EXCELLENT</span>
          </h1>
          <p className="text-slate-500 font-medium">Administration Portal</p>
        </div>

        <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[32px] bg-white/80 backdrop-blur-xl overflow-hidden">
          <CardHeader className="pt-8 px-8">
            <CardTitle className="text-xl font-bold text-slate-900">Sign In</CardTitle>
            <CardDescription className="text-slate-500">
              Access the management dashboard and system controls.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 px-8 pt-4 pb-8">
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-4 top-3 h-5 w-5 text-slate-400" />
                  <Input
                    type="email"
                    placeholder="Admin Email"
                    className="pl-12 h-12 rounded-2xl bg-slate-50 border-slate-100 focus:border-[#8424bd] focus:ring-[#8424bd] transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-4 top-3 h-5 w-5 text-slate-400" />
                  <Input
                    type="password"
                    placeholder="Password"
                    className="pl-12 h-12 rounded-2xl bg-slate-50 border-slate-100 focus:border-[#8424bd] focus:ring-[#8424bd] transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="px-8 pb-8">
              <Button 
                type="submit" 
                className="w-full h-14 rounded-2xl bg-[#8424bd] hover:bg-[#721fac] text-white font-bold text-lg shadow-xl shadow-purple-200 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-70"
                disabled={isSubmitLoading || isAuthLoading}
              >
                {isSubmitLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  'Continue to Dashboard'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
        
        <p className="text-center mt-8 text-slate-400 text-sm font-medium">
          Authorized personnel only. All access is logged.
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
