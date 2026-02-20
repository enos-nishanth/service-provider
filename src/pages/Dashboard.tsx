import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Clock,
  Star,
  ArrowRight,
  Search,
  X,
  DollarSign,
  Users,
  TrendingUp,
  Shield,
  AlertCircle,
  Settings,
  Package,
  Briefcase,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ServiceCategories, { categories } from "@/components/customer/ServiceCategories";
import ProviderList from "@/components/customer/ProviderList";
import EmptyState from "@/components/common/EmptyState";
import { useBookings, useBookingStats, useReviewStats } from "@/hooks/useBookings";
import { supabase } from "@/integrations/supabase/client";
import { useRequireAuth } from "@/hooks/useAuth";

const statusColors = {
  requested: "bg-amber-100 text-amber-700",
  accepted: "bg-blue-100 text-blue-700",
  in_progress: "bg-purple-100 text-purple-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { isChecking, isAuthenticated } = useRequireAuth();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [isProvider, setIsProvider] = useState(false);
  const [activeTab, setActiveTab] = useState<"customer" | "provider">("customer");
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Customer data
  const { bookings: customerBookings, isLoading: customerBookingsLoading } = useBookings({ 
    role: "customer", 
    limit: 3 
  });
  const { stats: customerStats, isLoading: customerStatsLoading } = useBookingStats("customer");
  const { count: reviewCount } = useReviewStats("customer");

  // Provider data
  const { bookings: providerBookings, isLoading: providerBookingsLoading } = useBookings({
    role: "provider",
    status: ["requested", "accepted", "in_progress"],
    limit: 5,
  });
  const { stats: providerStats } = useBookingStats("provider");
  const [providerMetrics, setProviderMetrics] = useState({
    averageRating: 0,
    totalReviews: 0,
    totalCustomers: 0,
    monthlyEarnings: 0,
    monthlyJobs: 0,
    growthPercent: 0,
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserData();
    }
  }, [isAuthenticated]);

  const fetchUserData = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/");
      return;
    }

    // Fetch profile
    const { data: profileData } = await supabase
      .from("users")
      .select("full_name, is_provider, average_rating, total_reviews")
      .eq("user_id", user.id)
      .single();

    if (profileData) {
      setUserName(profileData.full_name?.split(" ")[0] || "");
      setIsProvider(profileData.is_provider || false);
      
      if (profileData.is_provider) {
        // Fetch KYC status
        const { data: kycData } = await supabase
          .from("kyc_verifications")
          .select("status")
          .eq("user_id", user.id)
          .single();
        setKycStatus(kycData?.status || null);
        
        // Fetch provider metrics
        await fetchProviderMetrics(user.id, profileData);
      }
    }
    setIsLoading(false);
  };

  const fetchProviderMetrics = async (userId: string, profileData: any) => {
    const { data: bookingsData } = await supabase
      .from("bookings")
      .select("customer_id, total_amount, status, created_at")
      .eq("provider_id", userId);

    if (bookingsData) {
      const uniqueCustomers = new Set(bookingsData.map((b) => b.customer_id)).size;
      
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

      setProviderMetrics({
        averageRating: profileData?.average_rating || 0,
        totalReviews: profileData?.total_reviews || 0,
        totalCustomers: uniqueCustomers,
        monthlyEarnings: thisMonthEarnings,
        monthlyJobs: thisMonth.length,
        growthPercent: Math.round(growthPercent),
      });
    }
  };

  const selectedCategoryLabel = selectedCategory 
    ? categories.find(c => c.id === selectedCategory)?.label 
    : null;

  const upcomingProviderBookings = providerBookings.filter((b) => 
    ["requested", "accepted", "in_progress"].includes(b.status)
  );

  if (isChecking || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardLayout isProvider={isProvider} activeMode={activeTab} onModeChange={setActiveTab}>
      <div className="space-y-6">
        {/* Provider Mode Switcher (only for providers) */}
        {isProvider && (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "customer" | "provider")} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="customer" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Book Services
              </TabsTrigger>
              <TabsTrigger value="provider" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Provider Mode
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {/* CUSTOMER VIEW */}
        {activeTab === "customer" && (
          <>
            {/* Welcome Section */}
            <div className="rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6">
              <h1 className="mb-2 text-2xl font-bold text-foreground">
                Welcome back{userName ? `, ${userName}` : ""}! 👋
              </h1>
              <p className="mb-4 text-muted-foreground">What service do you need today?</p>
              
              <div className="relative max-w-xl">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search or describe your problem"
                  className="h-12 pl-10 pr-10 text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Service Categories */}
            <div>
              <h2 className="mb-4 text-lg font-semibold text-foreground">Browse by Category</h2>
              <ServiceCategories 
                selectedCategory={selectedCategory} 
                onSelectCategory={setSelectedCategory} 
              />
            </div>

            {/* Provider List */}
            {selectedCategory && (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">
                    {selectedCategoryLabel} Providers
                  </h2>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedCategory(null)}
                  >
                    <X className="mr-1 h-4 w-4" /> Clear
                  </Button>
                </div>
                <ProviderList categoryId={selectedCategory} searchQuery={searchQuery} />
              </div>
            )}

            {/* Customer Stats */}
            {!selectedCategory && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="rounded-xl bg-primary/10 p-3">
                        <Calendar className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        {customerStatsLoading ? (
                          <Skeleton className="mb-1 h-7 w-12" />
                        ) : (
                          <p className="text-2xl font-bold text-foreground">{customerStats.total}</p>
                        )}
                        <p className="text-sm text-muted-foreground">Total Bookings</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="rounded-xl bg-blue-500/10 p-3">
                        <Clock className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        {customerStatsLoading ? (
                          <Skeleton className="mb-1 h-7 w-12" />
                        ) : (
                          <p className="text-2xl font-bold text-foreground">{customerStats.ongoing}</p>
                        )}
                        <p className="text-sm text-muted-foreground">Ongoing</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="rounded-xl bg-emerald-500/10 p-3">
                        <Star className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div>
                        {customerStatsLoading ? (
                          <Skeleton className="mb-1 h-7 w-12" />
                        ) : (
                          <p className="text-2xl font-bold text-foreground">{customerStats.completed}</p>
                        )}
                        <p className="text-sm text-muted-foreground">Completed</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="rounded-xl bg-purple-500/10 p-3">
                        <Star className="h-6 w-6 text-purple-600" fill="currentColor" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">{reviewCount}</p>
                        <p className="text-sm text-muted-foreground">Reviews Given</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Recent Bookings */}
            {!selectedCategory && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Recent Bookings</CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/bookings">
                      View All <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  {customerBookingsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between rounded-xl border border-border p-4">
                          <div className="space-y-2">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                          <div className="flex items-center gap-4">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-6 w-16" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : customerBookings.length === 0 ? (
                    <EmptyState
                      icon={Calendar}
                      title="No bookings yet"
                      description="Book your first service to get started"
                      actionLabel="Browse Services"
                      actionHref="/browse"
                    />
                  ) : (
                    <div className="space-y-4">
                      {customerBookings.slice(0, 3).map((booking) => (
                        <Link
                          key={booking.id}
                          to={`/booking/${booking.booking_id}`}
                          className="block"
                        >
                          <div className="flex flex-col gap-4 rounded-xl border border-border p-4 transition-colors hover:bg-accent/50 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <h4 className="font-semibold capitalize text-foreground">
                                {booking.service_category.replace("-", " ")} Service
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {booking.provider?.full_name || "Service Provider"}
                              </p>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-sm text-muted-foreground">
                                <p>{format(new Date(booking.scheduled_date), "MMM d, yyyy")}</p>
                                <p>{booking.scheduled_time}</p>
                              </div>
                              <Badge className={statusColors[booking.status as keyof typeof statusColors]}>
                                {booking.status.replace("_", " ").charAt(0).toUpperCase() + 
                                 booking.status.replace("_", " ").slice(1)}
                              </Badge>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Become a Provider CTA (for non-providers) */}
            {!isProvider && !selectedCategory && (
              <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
                <CardContent className="flex flex-col items-center gap-4 p-6 sm:flex-row sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="rounded-xl bg-primary/10 p-3">
                      <Briefcase className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Want to offer your services?</h3>
                      <p className="text-sm text-muted-foreground">
                        Become a provider and start earning on HandyHive
                      </p>
                    </div>
                  </div>
                  <Button asChild>
                    <Link to="/become-provider">
                      Become a Provider <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* PROVIDER VIEW */}
        {activeTab === "provider" && isProvider && (
          <>
            {/* KYC Banner */}
            {kycStatus !== "approved" && (
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

            {/* Provider Welcome */}
            <div className="rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="mb-2 text-2xl font-bold text-foreground">
                    Provider Dashboard 🛠️
                  </h1>
                  <p className="text-muted-foreground">
                    {upcomingProviderBookings.length > 0
                      ? `You have ${upcomingProviderBookings.length} ${upcomingProviderBookings.length === 1 ? "booking" : "bookings"} to manage.`
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

            {/* Provider Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-xl bg-emerald-500/10 p-3">
                      <DollarSign className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        ₹{providerMetrics.monthlyEarnings.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">This Month</p>
                    </div>
                  </div>
                  {providerMetrics.growthPercent !== 0 && (
                    <div className={`mt-2 flex items-center gap-1 text-sm ${
                      providerMetrics.growthPercent > 0 ? "text-emerald-600" : "text-red-600"
                    }`}>
                      <TrendingUp className="h-4 w-4" />
                      <span>{providerMetrics.growthPercent > 0 ? "+" : ""}{providerMetrics.growthPercent}% from last month</span>
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
                      <p className="text-2xl font-bold text-foreground">{providerMetrics.monthlyJobs}</p>
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
                        {providerMetrics.averageRating ? providerMetrics.averageRating.toFixed(1) : "—"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Average Rating {providerMetrics.totalReviews > 0 && `(${providerMetrics.totalReviews})`}
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
                      <p className="text-2xl font-bold text-foreground">{providerMetrics.totalCustomers}</p>
                      <p className="text-sm text-muted-foreground">Total Customers</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Provider Bookings */}
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
                {providerBookingsLoading ? (
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
                ) : upcomingProviderBookings.length === 0 ? (
                  <EmptyState
                    icon={Package}
                    title="No pending bookings"
                    description="New booking requests will appear here when customers book your services."
                  />
                ) : (
                  <div className="space-y-4">
                    {upcomingProviderBookings.map((booking) => (
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
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
