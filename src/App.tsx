import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Gallery from "./pages/Gallery";
import EventView from "./pages/EventView";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AdminUpload from "./pages/admin/Upload";
import AdminEvents from "./pages/admin/Events";
import AdminEventNew from "./pages/admin/EventNew";
import AdminEventMedia from "./pages/admin/EventMedia";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/galeria" element={<Gallery />} />
            <Route path="/galeria/eventos/:id" element={<EventView />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route 
              path="/admin/upload" 
              element={
                <ProtectedRoute requireAdmin>
                  <AdminUpload />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/events" 
              element={
                <ProtectedRoute requireAdmin>
                  <AdminEvents />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/events/new" 
              element={
                <ProtectedRoute requireAdmin>
                  <AdminEventNew />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/events/:id/media" 
              element={
                <ProtectedRoute requireAdmin>
                  <AdminEventMedia />
                </ProtectedRoute>
              } 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
