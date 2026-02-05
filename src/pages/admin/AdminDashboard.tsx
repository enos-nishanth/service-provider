 import { useState, useEffect } from "react";
 import { useNavigate } from "react-router-dom";
 import DashboardLayout from "@/components/dashboard/DashboardLayout";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import {
   Users,
   Briefcase,
   Calendar,
   ArrowRight,
   TrendingUp,
   AlertCircle,
   CheckCircle2,
   Loader2,
   UserCheck,
   Clock,
   IndianRupee,
 } from "lucide-react";
 import {
   BarChart,
   Bar,
   XAxis,
   YAxis,
   CartesianGrid,
   Tooltip,
   ResponsiveContainer,
   PieChart,
   Pie,
   Cell,
   LineChart,
   Line,
   Legend,
 } from "recharts";
 import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";
 import { supabase } from "@/integrations/supabase/client";
 
 interface DashboardStats {
   totalUsers: number;
   totalProviders: number;
   totalBookings: number;
   totalRevenue: number;
   completedBookings: number;
   pendingBookings: number;
   cancelledBookings: number;
 }
 
 interface Booking {
   id: string;
   status: string;
   total_amount: number;
   service_category: string;
   created_at: string;
 }
 
 interface KYCVerification {
   id: string;
   user_id: string;
   status: string;
   created_at: string;
 }
 
 const AdminDashboard = () => {
   const navigate = useNavigate();
   const [isLoading, setIsLoading] = useState(true);
   const [isAuthorized, setIsAuthorized] = useState(false);
   const [stats, setStats] = useState<DashboardStats>({
     totalUsers: 0,
     totalProviders: 0,
     totalBookings: 0,
     totalRevenue: 0,
     completedBookings: 0,
     pendingBookings: 0,
     cancelledBookings: 0,
   });
   const [bookings, setBookings] = useState<Booking[]>([]);
   const [pendingKYC, setPendingKYC] = useState<KYCVerification[]>([]);
 
   useEffect(() => {
     const checkAdminAuth = async () => {
       try {
         const { data: { session } } = await supabase.auth.getSession();
 
         if (!session?.user) {
           navigate("/admin/login");
           return;
         }
 
         const { data: roleData, error } = await supabase
           .from("user_roles")
           .select("role")
           .eq("user_id", session.user.id)
           .eq("role", "admin")
           .single();
 
         if (error || !roleData) {
           await supabase.auth.signOut();
           navigate("/admin/login");
           return;
         }
 
         setIsAuthorized(true);
         await fetchDashboardData();
       } catch (error) {
         console.error("Auth check error:", error);
         navigate("/admin/login");
       } finally {
         setIsLoading(false);
       }
     };
 
     checkAdminAuth();
 
     const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
       if (event === "SIGNED_OUT") {
         navigate("/admin/login");
       }
     });
 
     return () => subscription.unsubscribe();
   }, [navigate]);
 
  const fetchDashboardData = async () => {
    try {
      const { data: usersData } = await supabase.from("users").select("*");
      const customers = usersData?.filter((u) => !u.is_provider) || [];
      const providers = usersData?.filter((u) => u.is_provider) || [];
 
       const { data: bookingsData } = await supabase
         .from("bookings")
         .select("*")
         .order("created_at", { ascending: false });
 
       const allBookings = bookingsData || [];
       const completedBookings = allBookings.filter((b) => b.status === "completed");
       const pendingBookings = allBookings.filter((b) =>
         ["requested", "accepted", "in_progress"].includes(b.status)
       );
       const cancelledBookings = allBookings.filter((b) => b.status === "cancelled");
       const totalRevenue = completedBookings.reduce((sum, b) => sum + b.total_amount, 0);
 
       setStats({
         totalUsers: customers.length,
         totalProviders: providers.length,
         totalBookings: allBookings.length,
         totalRevenue,
         completedBookings: completedBookings.length,
         pendingBookings: pendingBookings.length,
         cancelledBookings: cancelledBookings.length,
       });
 
       setBookings(allBookings);
 
       const { data: kycData } = await supabase
         .from("kyc_verifications")
         .select("*")
         .eq("status", "pending")
         .order("created_at", { ascending: false })
         .limit(5);
 
       setPendingKYC(kycData || []);
     } catch (error) {
       console.error("Error fetching dashboard data:", error);
     }
   };
 
   const getBookingsByDay = () => {
     const last7Days = eachDayOfInterval({
       start: subDays(new Date(), 6),
       end: new Date(),
     });
 
     return last7Days.map((day) => {
       const dayStart = startOfDay(day);
       const dayBookings = bookings.filter((b) => {
         const bookingDate = startOfDay(new Date(b.created_at));
         return bookingDate.getTime() === dayStart.getTime();
       });
 
       return {
         day: format(day, "EEE"),
         bookings: dayBookings.length,
         revenue: dayBookings.filter((b) => b.status === "completed").reduce((sum, b) => sum + b.total_amount, 0),
       };
     });
   };
 
   const getBookingStatusData = () => [
     { name: "Completed", value: stats.completedBookings, color: "hsl(142, 76%, 36%)" },
     { name: "Pending", value: stats.pendingBookings, color: "hsl(38, 92%, 50%)" },
     { name: "Cancelled", value: stats.cancelledBookings, color: "hsl(0, 84%, 60%)" },
   ];
 
   const getServiceCategoryData = () => {
     const categories: Record<string, number> = {};
     bookings.forEach((b) => {
       const cat = b.service_category.replace("-", " ");
       categories[cat] = (categories[cat] || 0) + 1;
     });
     return Object.entries(categories)
       .map(([name, count]) => ({ name, count }))
       .sort((a, b) => b.count - a.count)
       .slice(0, 5);
   };
 
   if (isLoading) {
     return (
       <div className="flex min-h-screen items-center justify-center bg-background">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
       </div>
     );
   }
 
   if (!isAuthorized) {
     return null;
   }
 
   const bookingsByDay = getBookingsByDay();
   const bookingStatusData = getBookingStatusData();
   const serviceCategoryData = getServiceCategoryData();
 
    return (
      <DashboardLayout isAdmin>
       <div className="space-y-6">
         <div className="rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6">
           <h1 className="mb-2 text-2xl font-bold text-foreground">Admin Dashboard</h1>
           <p className="text-muted-foreground">Monitor and manage the HandyHive marketplace</p>
         </div>
 
         <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
           <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-blue-500/5">
             <CardContent className="p-6">
               <div className="flex items-center gap-4">
                 <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-500/20">
                   <Users className="h-6 w-6 text-blue-600" />
                 </div>
                 <div>
                   <p className="text-3xl font-bold text-blue-600">{stats.totalUsers}</p>
                   <p className="text-sm text-muted-foreground">Total Customers</p>
                 </div>
               </div>
             </CardContent>
           </Card>
           <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5">
             <CardContent className="p-6">
               <div className="flex items-center gap-4">
                 <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/20">
                   <UserCheck className="h-6 w-6 text-primary" />
                 </div>
                 <div>
                   <p className="text-3xl font-bold text-primary">{stats.totalProviders}</p>
                   <p className="text-sm text-muted-foreground">Service Providers</p>
                 </div>
               </div>
             </CardContent>
           </Card>
           <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5">
             <CardContent className="p-6">
               <div className="flex items-center gap-4">
                 <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-500/20">
                   <Calendar className="h-6 w-6 text-emerald-600" />
                 </div>
                 <div>
                   <p className="text-3xl font-bold text-emerald-600">{stats.totalBookings}</p>
                   <p className="text-sm text-muted-foreground">Total Bookings</p>
                 </div>
               </div>
             </CardContent>
           </Card>
           <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-purple-500/5">
             <CardContent className="p-6">
               <div className="flex items-center gap-4">
                 <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-purple-500/20">
                   <IndianRupee className="h-6 w-6 text-purple-600" />
                 </div>
                 <div>
                   <p className="text-3xl font-bold text-purple-600">
                     ₹{stats.totalRevenue >= 100000 ? `${(stats.totalRevenue / 100000).toFixed(1)}L` : stats.totalRevenue.toLocaleString()}
                   </p>
                   <p className="text-sm text-muted-foreground">Total Revenue</p>
                 </div>
               </div>
             </CardContent>
           </Card>
         </div>
 
         <div className="grid gap-6 lg:grid-cols-3">
           <Card className="lg:col-span-2">
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <TrendingUp className="h-5 w-5 text-primary" />
                 Bookings & Revenue (Last 7 Days)
               </CardTitle>
             </CardHeader>
             <CardContent>
               <ResponsiveContainer width="100%" height={300}>
                 <LineChart data={bookingsByDay}>
                   <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                   <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                   <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                   <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                   <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                   <Legend />
                   <Line yAxisId="left" type="monotone" dataKey="bookings" stroke="hsl(var(--primary))" strokeWidth={2} name="Bookings" />
                   <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="hsl(142, 76%, 36%)" strokeWidth={2} name="Revenue (₹)" />
                 </LineChart>
               </ResponsiveContainer>
             </CardContent>
           </Card>
 
           <Card>
             <CardHeader>
               <CardTitle>Booking Status</CardTitle>
             </CardHeader>
             <CardContent>
               {stats.totalBookings === 0 ? (
                 <div className="flex h-[200px] items-center justify-center text-muted-foreground">No bookings yet</div>
               ) : (
                 <>
                   <ResponsiveContainer width="100%" height={200}>
                     <PieChart>
                       <Pie data={bookingStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                         {bookingStatusData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.color} />
                         ))}
                       </Pie>
                       <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                     </PieChart>
                   </ResponsiveContainer>
                   <div className="mt-4 flex justify-center gap-4">
                     {bookingStatusData.map((item) => (
                       <div key={item.name} className="flex items-center gap-2">
                         <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                         <span className="text-xs text-muted-foreground">{item.name} ({item.value})</span>
                       </div>
                     ))}
                   </div>
                 </>
               )}
             </CardContent>
           </Card>
         </div>
 
         <div className="grid gap-6 lg:grid-cols-2">
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <Briefcase className="h-5 w-5 text-primary" />
                 Popular Service Categories
               </CardTitle>
             </CardHeader>
             <CardContent>
               {serviceCategoryData.length === 0 ? (
                 <div className="flex h-[250px] items-center justify-center text-muted-foreground">No booking data yet</div>
               ) : (
                 <ResponsiveContainer width="100%" height={250}>
                   <BarChart data={serviceCategoryData} layout="vertical">
                     <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                     <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                     <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={80} />
                     <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                     <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                   </BarChart>
                 </ResponsiveContainer>
               )}
             </CardContent>
           </Card>
 
           <Card>
             <CardHeader className="flex flex-row items-center justify-between">
               <CardTitle className="flex items-center gap-2">
                 <Clock className="h-5 w-5 text-primary" />
                 Pending KYC Verifications
               </CardTitle>
               <Badge variant="secondary">{pendingKYC.length} pending</Badge>
             </CardHeader>
             <CardContent>
               {pendingKYC.length === 0 ? (
                 <div className="flex h-[200px] flex-col items-center justify-center text-center">
                   <CheckCircle2 className="mb-2 h-10 w-10 text-emerald-500" />
                   <p className="text-muted-foreground">All verifications up to date!</p>
                 </div>
               ) : (
                 <div className="space-y-3">
                   {pendingKYC.map((kyc) => (
                     <div key={kyc.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                       <div className="flex items-center gap-3">
                         <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
                           <AlertCircle className="h-5 w-5 text-amber-600" />
                         </div>
                         <div>
                           <p className="text-sm font-medium text-foreground">Provider Verification</p>
                           <p className="text-xs text-muted-foreground">Submitted {format(new Date(kyc.created_at), "MMM d, yyyy")}</p>
                         </div>
                       </div>
                       <Button size="sm" variant="outline">Review</Button>
                     </div>
                   ))}
                 </div>
               )}
               {pendingKYC.length > 4 && (
                 <Button variant="ghost" className="mt-4 w-full">
                   View All ({pendingKYC.length}) <ArrowRight className="ml-2 h-4 w-4" />
                 </Button>
               )}
             </CardContent>
           </Card>
         </div>
 
         <div className="grid gap-4 sm:grid-cols-3">
           <Card className="bg-emerald-500/5">
             <CardContent className="flex items-center justify-between p-4">
               <div>
                 <p className="text-sm text-muted-foreground">Completed Jobs</p>
                 <p className="text-2xl font-bold text-emerald-600">{stats.completedBookings}</p>
               </div>
               <CheckCircle2 className="h-8 w-8 text-emerald-500/50" />
             </CardContent>
           </Card>
           <Card className="bg-amber-500/5">
             <CardContent className="flex items-center justify-between p-4">
               <div>
                 <p className="text-sm text-muted-foreground">Active Jobs</p>
                 <p className="text-2xl font-bold text-amber-600">{stats.pendingBookings}</p>
               </div>
               <Clock className="h-8 w-8 text-amber-500/50" />
             </CardContent>
           </Card>
           <Card className="bg-red-500/5">
             <CardContent className="flex items-center justify-between p-4">
               <div>
                 <p className="text-sm text-muted-foreground">Cancelled</p>
                 <p className="text-2xl font-bold text-red-600">{stats.cancelledBookings}</p>
               </div>
               <AlertCircle className="h-8 w-8 text-red-500/50" />
             </CardContent>
           </Card>
         </div>
       </div>
     </DashboardLayout>
   );
 };
 
 export default AdminDashboard;