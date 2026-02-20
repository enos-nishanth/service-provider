import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import NotificationBell from "@/components/notifications/NotificationBell";
import {
  Hexagon,
  Home,
  Calendar,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  Briefcase,
  Users,
  BarChart3,
  FileText,
  AlertTriangle,
} from "lucide-react";

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  isProvider?: boolean;
  isAdmin?: boolean;
  activeMode?: "customer" | "provider";
  onModeChange?: (mode: "customer" | "provider") => void;
}

// Customer navigation items
const customerNavItems: NavItem[] = [
  { name: "Dashboard", path: "/dashboard", icon: Home },
  { name: "My Bookings", path: "/bookings", icon: Calendar },
  { name: "Browse Services", path: "/browse", icon: Search },
  { name: "Profile", path: "/profile", icon: User },
];

// Additional provider navigation items
const providerNavItems: NavItem[] = [
  { name: "Job Requests", path: "/provider/bookings", icon: Calendar },
  { name: "Earnings", path: "/provider/earnings", icon: BarChart3 },
  { name: "Availability", path: "/provider/availability", icon: Settings },
  { name: "KYC", path: "/provider/kyc", icon: FileText },
];

// Admin navigation items
const adminNavItems: NavItem[] = [
  { name: "Dashboard", path: "/admin", icon: Home },
  { name: "Users", path: "/admin/users", icon: Users },
  { name: "Bookings", path: "/admin/bookings", icon: Calendar },
  { name: "Fraud Monitor", path: "/admin/fraud", icon: AlertTriangle },
];

const DashboardLayout = ({ 
  children, 
  isProvider = false, 
  isAdmin = false,
  activeMode = "customer",
  onModeChange 
}: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Build navigation items based on role and mode
  const getNavItems = (): NavItem[] => {
    if (isAdmin) {
      return adminNavItems;
    }
    
    if (isProvider && activeMode === "provider") {
      return [
        { name: "Dashboard", path: "/dashboard", icon: Home },
        ...providerNavItems,
      ];
    }
    
    return customerNavItems;
  };

  const items = getNavItems();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        setUser({
          name: authUser.user_metadata?.full_name || "User",
          email: authUser.email || "",
        });
      }
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
      navigate("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not log out",
        variant: "destructive",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getRoleLabel = () => {
    if (isAdmin) return "Administrator";
    if (isProvider && activeMode === "provider") return "Provider Mode";
    return "Customer";
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-sidebar transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
                <Hexagon className="h-5 w-5 text-sidebar-primary-foreground" fill="currentColor" />
              </div>
              <span className="text-lg font-bold text-sidebar-foreground">
                Handy<span className="text-sidebar-primary">Hive</span>
              </span>
            </Link>
            <button
              className="rounded-lg p-2 text-sidebar-foreground hover:bg-sidebar-accent lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Role Badge */}
          <div className="border-b border-sidebar-border px-4 py-3">
            <span className="rounded-full bg-sidebar-accent px-3 py-1 text-xs font-medium text-sidebar-accent-foreground">
              {getRoleLabel()}
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {items.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}

            {/* Provider section separator */}
            {isProvider && activeMode === "customer" && (
              <div className="pt-4">
                <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                  Provider
                </div>
                <button
                  onClick={() => onModeChange?.("provider")}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  <Briefcase className="h-5 w-5" />
                  Switch to Provider Mode
                </button>
              </div>
            )}

            {isProvider && activeMode === "provider" && (
              <div className="pt-4">
                <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                  Customer
                </div>
                <button
                  onClick={() => onModeChange?.("customer")}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  <Search className="h-5 w-5" />
                  Book Services
                </button>
              </div>
            )}
          </nav>

          {/* User & Logout */}
          <div className="border-t border-sidebar-border p-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-accent text-sm font-semibold text-sidebar-accent-foreground">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div>
                <p className="text-sm font-medium text-sidebar-foreground truncate max-w-[140px]">
                  {user?.name || "User"}
                </p>
                <p className="text-xs text-sidebar-foreground/60 truncate max-w-[140px]">
                  {user?.email || ""}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <LogOut className="h-5 w-5" />
              )}
              {isLoggingOut ? "Logging out..." : "Log Out"}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur-sm lg:px-6">
          <button
            className="rounded-lg p-2 hover:bg-accent lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="hidden lg:block">
            <h1 className="text-lg font-semibold text-foreground">
              {items.find((item) => item.path === location.pathname)?.name || "Dashboard"}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
