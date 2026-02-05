import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, Star, ArrowRight, Search, X, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import ServiceCategories, { categories } from "@/components/customer/ServiceCategories";
import ProviderList from "@/components/customer/ProviderList";
import EmptyState from "@/components/common/EmptyState";
import { useBookings, useBookingStats, useReviewStats } from "@/hooks/useBookings";
import { supabase } from "@/integrations/supabase/client";

const statusColors = {
  requested: "bg-amber-100 text-amber-700",
  accepted: "bg-blue-100 text-blue-700",
  in_progress: "bg-purple-100 text-purple-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");

  const { bookings, isLoading: bookingsLoading } = useBookings({ 
    role: "customer", 
    limit: 3 
  });
  const { stats, isLoading: statsLoading } = useBookingStats("customer");
  const { count: reviewCount } = useReviewStats("customer");

  useEffect(() => {
    fetchUserName();
  }, []);

  const fetchUserName = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data } = await supabase
      .from("users")
      .select("full_name")
      .eq("user_id", user.id)
      .single();

    if (data) {
      setUserName(data.full_name.split(" ")[0]);
    }
  };

  const selectedCategoryLabel = selectedCategory 
    ? categories.find(c => c.id === selectedCategory)?.label 
    : null;

  const recentBookings = bookings.slice(0, 3);

    return (
      <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6">
          <h1 className="mb-2 text-2xl font-bold text-foreground">
            Welcome back{userName ? `, ${userName}` : ""}! 👋
          </h1>
          <p className="mb-4 text-muted-foreground">What service do you need today?</p>
          
          {/* Search Bar */}
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

        {/* Provider List - Shows when category is selected */}
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

        {/* Stats Grid */}
        {!selectedCategory && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-primary/10 p-3">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    {statsLoading ? (
                      <Skeleton className="mb-1 h-7 w-12" />
                    ) : (
                      <p className="text-2xl font-bold text-foreground">{stats.total}</p>
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
                    {statsLoading ? (
                      <Skeleton className="mb-1 h-7 w-12" />
                    ) : (
                      <p className="text-2xl font-bold text-foreground">{stats.ongoing}</p>
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
                    {statsLoading ? (
                      <Skeleton className="mb-1 h-7 w-12" />
                    ) : (
                      <p className="text-2xl font-bold text-foreground">{stats.completed}</p>
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
              {bookingsLoading ? (
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
              ) : recentBookings.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="No bookings yet"
                  description="Book your first service to get started"
                  actionLabel="Browse Services"
                  actionHref="/services"
                />
              ) : (
                <div className="space-y-4">
                  {recentBookings.map((booking) => (
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
      </div>
    </DashboardLayout>
  );
};

export default CustomerDashboard;
