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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppLayout() {
  const location = useLocation();
  const [isFullPage, setIsFullPage] = useState(false);
  
  console.log('HIDE SIDEBAR LOGIC:', {
    pathname: location.pathname,
    isStatus: location.pathname === '/status',
    isFullPage,
    hideSidebar: (isFullPage && location.pathname === '/') || location.pathname === '/status'
  });

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullPage(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Force path to lowercase and check for status
  const isStatusPage = location.pathname.toLowerCase().includes('status');
  const hideSidebar = isStatusPage || (isFullPage && location.pathname === '/');

  return (
    <div className="min-h-screen bg-background transition-all duration-500">
      {!hideSidebar && <Navigation key={location.pathname} />}
      <main 
        key={location.pathname}
        className={hideSidebar ? "w-full" : "md:ml-[260px]"}
      >
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/register" element={<Register />} />
          <Route path="/students" element={<Students />} />
          <Route path="/logs" element={<Logs />} />
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
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
