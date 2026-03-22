import { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Register from "./pages/Register";
import Students from "./pages/Students";
import Logs from "./pages/Logs";
import AttendanceStatus from "./pages/AttendanceStatus";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AttendanceScanner from "./pages/AttendanceScanner";
import StaffDashboard from "@/pages/StaffDashboard";
import AdminStaffManagement from "@/pages/AdminStaffManagement";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

function AppLayout() {
  const location = useLocation();
  const [isFullPage, setIsFullPage] = useState(false);
  
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullPage(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Use includes for status to handle any sub-routes if needed later
  const isStatusPage = location.pathname.toLowerCase().includes('status');
  const isLoginPage = location.pathname === '/' || location.pathname === '/login';
  const hideSidebar = isStatusPage || isLoginPage || isFullPage;

  return (
    <div className="min-h-screen bg-background transition-all duration-500 selection:bg-purple-100 selection:text-purple-600">
      {!hideSidebar && <Navigation />}
      <main className={hideSidebar ? "w-full" : "md:ml-[280px]"}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Index />} /> {/* Redirecting /login to / */}
          <Route path="/admin/scanner" element={
            <ProtectedRoute>
              <AttendanceScanner />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/register" element={
            <ProtectedRoute>
              <Register />
            </ProtectedRoute>
          } />
          <Route path="/students" element={
            <ProtectedRoute>
              <Students />
            </ProtectedRoute>
          } />
          <Route path="/staff/dashboard" element={
            <ProtectedRoute>
              <StaffDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/staff" element={
            <ProtectedRoute>
              <AdminStaffManagement />
            </ProtectedRoute>
          } />
          <Route path="/status" element={<AttendanceStatus />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
        <Toaster />
        <Sonner />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
