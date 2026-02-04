import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Public pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import RecoverPassword from "./pages/RecoverPassword";
import NotFound from "./pages/NotFound";

// Protected pages
import Dashboard from "./pages/Dashboard";
import Dossiers from "./pages/Dossiers";
import DossierDetail from "./pages/DossierDetail";
import Chronology from "./pages/Chronology";
import Reports from "./pages/Reports";
import Archive from "./pages/Archive";
import Treasury from "./pages/Treasury";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/recuperar-password" element={<RecoverPassword />} />

            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/dossiers"
              element={
                <ProtectedRoute>
                  <Dossiers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/dossiers/:id"
              element={
                <ProtectedRoute>
                  <DossierDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/cronologia"
              element={
                <ProtectedRoute>
                  <Chronology />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/relatorios"
              element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/arquivo"
              element={
                <ProtectedRoute>
                  <Archive />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/tesouraria"
              element={
                <ProtectedRoute>
                  <Treasury />
                </ProtectedRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
