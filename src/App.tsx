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

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullPage(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Also allow manual trigger if needed, but event listener is more robust
  const hideSidebar = (isFullPage && location.pathname === '/') || location.pathname === '/status';

  return (
    <div className="min-h-screen bg-background transition-all duration-500">
      {!hideSidebar && <Navigation />}
      <main className={hideSidebar ? "w-full" : "md:ml-[260px]"}>
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
