import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Public pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Services from "./pages/Services";
import NotFound from "./pages/NotFound";
import ProviderSignup from "./pages/ProviderSignup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Contact from "./pages/Contact";
import About from "./pages/About";
import Blog from "./pages/Blog";
import Safety from "./pages/Safety";
import Help from "./pages/Help";
import Careers from "./pages/Careers";

// Unified dashboard
import Dashboard from "./pages/Dashboard";
import BecomeProvider from "./pages/BecomeProvider";

// Customer pages (now unified routes)
import BookingPage from "./pages/customer/BookingPage";
import PaymentPage from "./pages/customer/PaymentPage";
import BookingDetail from "./pages/customer/BookingDetail";
import BookingsHistory from "./pages/customer/BookingsHistory";
import ReviewPage from "./pages/customer/ReviewPage";
import CustomerProfile from "./pages/customer/CustomerProfile";
import BrowseServices from "./pages/customer/BrowseServices";

// Provider pages
import KYCVerification from "./pages/provider/KYCVerification";
import SkillAvailabilitySetup from "./pages/provider/SkillAvailabilitySetup";
import JobRequests from "./pages/provider/JobRequests";
import EarningsDashboard from "./pages/provider/EarningsDashboard";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminLogin from "./pages/admin/AdminLogin";
import UserManagement from "./pages/admin/UserManagement";
import BookingsRevenue from "./pages/admin/BookingsRevenue";
import FraudMonitoring from "./pages/admin/FraudMonitoring";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public Routes - Unauthenticated users only */}
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/services" element={<Services />} />
          <Route path="/provider-signup" element={<ProviderSignup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          
          {/* Info Pages */}
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/about" element={<About />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/safety" element={<Safety />} />
          <Route path="/help" element={<Help />} />
          <Route path="/careers" element={<Careers />} />

          {/* Unified Dashboard - All authenticated users */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/become-provider" element={<BecomeProvider />} />

          {/* Customer Routes - All authenticated users can book */}
          <Route path="/browse" element={<BrowseServices />} />
          <Route path="/book/:providerId" element={<BookingPage />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/bookings" element={<BookingsHistory />} />
          <Route path="/booking/:bookingId" element={<BookingDetail />} />
          <Route path="/review/:bookingId" element={<ReviewPage />} />
          <Route path="/profile" element={<CustomerProfile />} />

          {/* Provider Routes - Only users with is_provider = true */}
          <Route path="/provider/kyc" element={<KYCVerification />} />
          <Route path="/provider/availability" element={<SkillAvailabilitySetup />} />
          <Route path="/provider/bookings" element={<JobRequests />} />
          <Route path="/provider/earnings" element={<EarningsDashboard />} />

          {/* Admin Routes - Only users with admin role */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/bookings" element={<BookingsRevenue />} />
          <Route path="/admin/fraud" element={<FraudMonitoring />} />

          {/* Legacy redirects */}
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="/customer" element={<Navigate to="/dashboard" replace />} />
          <Route path="/customer/*" element={<Navigate to="/dashboard" replace />} />
          <Route path="/provider" element={<Navigate to="/dashboard" replace />} />
          <Route path="/signup/*" element={<Navigate to="/auth?mode=signup" replace />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
