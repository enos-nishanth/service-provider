import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Calendar, 
  DollarSign, 
  Star, 
  Users,
  ArrowRight,
  TrendingUp,
  Clock,
  Shield,
  AlertCircle,
  Settings,
  Package,
} from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useBookings, useBookingStats } from "@/hooks/useBookings";
import EmptyState from "@/components/common/EmptyState";

const statusColors = {
  requested: "bg-amber-100 text-amber-700",
  accepted: "bg-blue-100 text-blue-700",
  in_progress: "bg-purple-100 text-purple-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

const ProviderDashboard = () => {
  const navigate = useNavigate();
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [isKYCLoading, setIsKYCLoading] = useState(true);
  const [userName, setUserName] = useState<string>("");
  const [providerStats, setProviderStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    totalCustomers: 0,
    monthlyEarnings: 0,
    monthlyJobs: 0,
    growthPercent: 0,
  });

  const { bookings, isLoading: bookingsLoading } = useBookings({
    role: "provider",
    status: ["requested", "accepted", "in_progress"],
    limit: 5,
  });

  const { stats } = useBookingStats("provider");

  useEffect(() => {
    checkUserAndKYC();
    fetchProviderStats();
  }, []);

  const checkUserAndKYC = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    // Fetch profile
    const { data: profileData } = await supabase
      .from("users")
      .select("full_name, is_provider")
      .eq("user_id", user.id)
      .single();

    if (profileData) {
      if (!profileData.is_provider) {
        navigate("/dashboard");
        return;
      }
      setUserName(profileData.full_name.split(" ")[0]);
    }

    // Fetch KYC status
    const { data: kycData } = await supabase
      .from("kyc_verifications")
      .select("status")
      .eq("user_id", user.id)
      .single();
    
    setKycStatus(kycData?.status || null);
    setIsKYCLoading(false);
  };

  const fetchProviderStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch profile stats
    const { data: profileData } = await supabase
      .from("users")
      .select("average_rating, total_reviews")
      .eq("user_id", user.id)
      .single();

    // Fetch unique customers
    const { data: bookingsData } = await supabase
      .from("bookings")
      .select("customer_id, total_amount, status, created_at")
      .eq("provider_id", user.id);

    if (bookingsData) {
      const uniqueCustomers = new Set(bookingsData.map((b) => b.customer_id)).size;
      
      // Calculate monthly stats
      const now = new Date();
      const thisMonth = bookingsData.filter((b) => {
        const bookingDate = new Date(b.created_at);
        return (
          bookingDate.getMonth() === now.getMonth() &&
          bookingDate.getFullYear() === now.getFullYear() &&
          b.status === "completed"
        );
      });
      
      const lastMonth = bookingsData.filter((b) => {
        const bookingDate = new Date(b.created_at);
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return (
          bookingDate.getMonth() === lastMonthDate.getMonth() &&
          bookingDate.getFullYear() === lastMonthDate.getFullYear() &&
          b.status === "completed"
        );
      });

      const thisMonthEarnings = thisMonth.reduce((sum, b) => sum + b.total_amount, 0);
      const lastMonthEarnings = lastMonth.reduce((sum, b) => sum + b.total_amount, 0);
      const growthPercent = lastMonthEarnings > 0
        ? ((thisMonthEarnings - lastMonthEarnings) / lastMonthEarnings) * 100
        : thisMonthEarnings > 0 ? 100 : 0;

      setProviderStats({
        averageRating: profileData?.average_rating || 0,
        totalReviews: profileData?.total_reviews || 0,
        totalCustomers: uniqueCustomers,
        monthlyEarnings: thisMonthEarnings,
        monthlyJobs: thisMonth.length,
        growthPercent: Math.round(growthPercent),
      });
    }
  };

  const upcomingBookings = bookings.filter((b) => 
    ["requested", "accepted", "in_progress"].includes(b.status)
  );

    return (
      <DashboardLayout isProvider activeMode="provider">
      <div className="space-y-6">
        {/* KYC Banner */}
        {!isKYCLoading && kycStatus !== "approved" && (
          <div className={`flex items-center justify-between rounded-xl p-4 ${
            kycStatus === "rejected" 
              ? "border border-destructive/30 bg-destructive/10" 
              : kycStatus === "pending" || kycStatus === "under_review"
              ? "border border-amber-300 bg-amber-50"
              : "border border-primary/30 bg-accent"
          }`}>
            <div className="flex items-center gap-3">
              {kycStatus === "rejected" ? (
                <AlertCircle className="h-5 w-5 text-destructive" />
              ) : (
                <Shield className="h-5 w-5 text-primary" />
              )}
              <div>
                <p className="font-medium text-foreground">
                  {!kycStatus && "Complete KYC Verification"}
                  {kycStatus === "pending" && "KYC Verification Pending"}
                  {kycStatus === "under_review" && "KYC Under Review"}
                  {kycStatus === "rejected" && "KYC Verification Rejected"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {!kycStatus && "You need to complete KYC to accept service requests"}
                  {kycStatus === "pending" && "Your documents are being reviewed (24-48 hours)"}
                  {kycStatus === "under_review" && "Our team is reviewing your documents"}
                  {kycStatus === "rejected" && "Please re-submit your documents"}
                </p>
              </div>
            </div>
            <Button size="sm" asChild>
              <Link to="/provider/kyc">
                {kycStatus === "rejected" ? "Re-submit" : kycStatus ? "View Status" : "Complete KYC"}
              </Link>
            </Button>
          </div>
        )}

        {/* Welcome Section */}
        <div className="rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="mb-2 text-2xl font-bold text-foreground">
                Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}{userName ? `, ${userName}` : ""}! 🛠️
              </h1>
              <p className="text-muted-foreground">
                {upcomingBookings.length > 0
                  ? `You have ${upcomingBookings.length} ${upcomingBookings.length === 1 ? "booking" : "bookings"} to manage.`
                  : "No pending bookings right now."}
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/provider/availability">
                <Settings className="mr-2 h-4 w-4" />
                Manage Availability
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-emerald-500/10 p-3">
                  <DollarSign className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    ₹{providerStats.monthlyEarnings.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">This Month</p>
                </div>
              </div>
              {providerStats.growthPercent !== 0 && (
                <div className={`mt-2 flex items-center gap-1 text-sm ${
                  providerStats.growthPercent > 0 ? "text-emerald-600" : "text-red-600"
                }`}>
                  <TrendingUp className="h-4 w-4" />
                  <span>{providerStats.growthPercent > 0 ? "+" : ""}{providerStats.growthPercent}% from last month</span>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-blue-500/10 p-3">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{providerStats.monthlyJobs}</p>
                  <p className="text-sm text-muted-foreground">Jobs This Month</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-primary/10 p-3">
                  <Star className="h-6 w-6 text-primary" fill="currentColor" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {providerStats.averageRating ? providerStats.averageRating.toFixed(1) : "—"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Average Rating {providerStats.totalReviews > 0 && `(${providerStats.totalReviews})`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-purple-500/10 p-3">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{providerStats.totalCustomers}</p>
                  <p className="text-sm text-muted-foreground">Total Customers</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Bookings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Upcoming Bookings</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/provider/bookings">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {bookingsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl border border-border p-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-20" />
                  </div>
                ))}
              </div>
            ) : upcomingBookings.length === 0 ? (
              <EmptyState
                icon={Package}
                title="No pending bookings"
                description="New booking requests will appear here when customers book your services."
              />
            ) : (
              <div className="space-y-4">
                {upcomingBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex flex-col gap-4 rounded-xl border border-border p-4 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                          {booking.customer?.full_name
                            ? booking.customer.full_name.split(" ").map((n) => n[0]).join("").toUpperCase()
                            : "C"}
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">
                            {booking.customer?.full_name || "Customer"}
                          </h4>
                          <p className="text-sm capitalize text-muted-foreground">
                            {booking.service_category.replace("-", " ")}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(booking.scheduled_date), "MMM d, yyyy")}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {booking.scheduled_time}
                      </div>
                      <Badge className={statusColors[booking.status as keyof typeof statusColors]}>
                        {booking.status.replace("_", " ").charAt(0).toUpperCase() + 
                         booking.status.replace("_", " ").slice(1)}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link to="/provider/bookings">View</Link>
                      </Button>
                      {booking.status === "requested" && (
                        <Button size="sm" asChild>
                          <Link to="/provider/bookings">Respond</Link>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ProviderDashboard;
