 import { useState, useEffect } from "react";
 import { useNavigate } from "react-router-dom";
 import DashboardLayout from "@/components/dashboard/DashboardLayout";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { Input } from "@/components/ui/input";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
 } from "@/components/ui/table";
 import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
 } from "@/components/ui/dialog";
 import {
   IndianRupee,
   Calendar,
   Search,
   Loader2,
   TrendingUp,
   CheckCircle2,
   Clock,
   XCircle,
   Eye,
   CreditCard,
   Wallet,
   PiggyBank,
   ArrowUpRight,
   ArrowDownRight,
 } from "lucide-react";
 import {
   LineChart,
   Line,
   XAxis,
   YAxis,
   CartesianGrid,
   Tooltip,
   ResponsiveContainer,
   BarChart,
   Bar,
   PieChart,
   Pie,
   Cell,
 } from "recharts";
 import { format, subDays, startOfDay, eachDayOfInterval, startOfMonth, endOfMonth, subMonths } from "date-fns";
 import { supabase } from "@/integrations/supabase/client";
 import { toast } from "sonner";
 
 const PLATFORM_COMMISSION_RATE = 0.15; // 15% platform commission
 
 interface Booking {
   id: string;
   booking_id: string;
   customer_id: string;
   provider_id: string;
   service_category: string;
   scheduled_date: string;
   scheduled_time: string;
   status: string;
   payment_status: string;
   payment_method: string;
   subtotal: number;
   tax: number;
   visit_charge: number;
   total_amount: number;
   customer_address: string | null;
   notes: string | null;
   created_at: string;
 }
 
 interface Profile {
   user_id: string;
   full_name: string;
   email: string | null;
 }
 
 const BookingsRevenue = () => {
   const navigate = useNavigate();
   const [isLoading, setIsLoading] = useState(true);
   const [isAuthorized, setIsAuthorized] = useState(false);
   const [bookings, setBookings] = useState<Booking[]>([]);
   const [profiles, setProfiles] = useState<Profile[]>([]);
   const [searchQuery, setSearchQuery] = useState("");
   const [statusFilter, setStatusFilter] = useState("all");
   const [paymentFilter, setPaymentFilter] = useState("all");
   const [dateRange, setDateRange] = useState("this_month");
 
   // Booking Detail Modal
   const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
   const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
 
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
         await fetchData();
       } catch (error) {
         console.error("Auth check error:", error);
         navigate("/admin/login");
       } finally {
         setIsLoading(false);
       }
     };
 
     checkAdminAuth();
   }, [navigate]);
 
   const fetchData = async () => {
     try {
       const { data: bookingsData, error: bookingsError } = await supabase
         .from("bookings")
         .select("*")
         .order("created_at", { ascending: false });
 
       if (bookingsError) throw bookingsError;
       setBookings(bookingsData || []);
 
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("user_id, full_name, email");

      if (usersError) throw usersError;
      setProfiles(usersData || []);
     } catch (error) {
       console.error("Error fetching data:", error);
       toast.error("Failed to load data");
     }
   };
 
   const getProfileName = (userId: string) => {
     const profile = profiles.find((p) => p.user_id === userId);
     return profile?.full_name || "Unknown";
   };
 
   const getFilteredBookings = () => {
     let filtered = [...bookings];
 
     // Date range filter
     const now = new Date();
     if (dateRange === "today") {
       const todayStart = startOfDay(now);
       filtered = filtered.filter((b) => new Date(b.created_at) >= todayStart);
     } else if (dateRange === "this_week") {
       const weekAgo = subDays(now, 7);
       filtered = filtered.filter((b) => new Date(b.created_at) >= weekAgo);
     } else if (dateRange === "this_month") {
       const monthStart = startOfMonth(now);
       filtered = filtered.filter((b) => new Date(b.created_at) >= monthStart);
     } else if (dateRange === "last_month") {
       const lastMonthStart = startOfMonth(subMonths(now, 1));
       const lastMonthEnd = endOfMonth(subMonths(now, 1));
       filtered = filtered.filter((b) => {
         const date = new Date(b.created_at);
         return date >= lastMonthStart && date <= lastMonthEnd;
       });
     }
 
     // Status filter
     if (statusFilter !== "all") {
       filtered = filtered.filter((b) => b.status === statusFilter);
     }
 
     // Payment filter
     if (paymentFilter !== "all") {
       filtered = filtered.filter((b) => b.payment_status === paymentFilter);
     }
 
     // Search
     if (searchQuery.trim()) {
       const query = searchQuery.toLowerCase();
       filtered = filtered.filter(
         (b) =>
           b.booking_id.toLowerCase().includes(query) ||
           b.service_category.toLowerCase().includes(query) ||
           getProfileName(b.customer_id).toLowerCase().includes(query) ||
           getProfileName(b.provider_id).toLowerCase().includes(query)
       );
     }
 
     return filtered;
   };
 
   const filteredBookings = getFilteredBookings();
 
   // Calculate stats
   const completedBookings = filteredBookings.filter((b) => b.status === "completed");
   const totalRevenue = completedBookings.reduce((sum, b) => sum + b.total_amount, 0);
   const platformCommission = totalRevenue * PLATFORM_COMMISSION_RATE;
   const providerEarnings = totalRevenue - platformCommission;
   const pendingPayments = filteredBookings
     .filter((b) => b.payment_status === "pending" && b.status !== "cancelled")
     .reduce((sum, b) => sum + b.total_amount, 0);
 
   // Revenue trend data
   const getRevenueTrend = () => {
     const last7Days = eachDayOfInterval({
       start: subDays(new Date(), 6),
       end: new Date(),
     });
 
     return last7Days.map((day) => {
       const dayStart = startOfDay(day);
       const dayBookings = bookings.filter((b) => {
         const bookingDate = startOfDay(new Date(b.created_at));
         return bookingDate.getTime() === dayStart.getTime() && b.status === "completed";
       });
       const revenue = dayBookings.reduce((sum, b) => sum + b.total_amount, 0);
 
       return {
         day: format(day, "EEE"),
         revenue,
         commission: revenue * PLATFORM_COMMISSION_RATE,
       };
     });
   };
 
   // Payment method breakdown
   const getPaymentMethodData = () => {
     const online = completedBookings.filter((b) => b.payment_method === "online").length;
     const cash = completedBookings.filter((b) => b.payment_method === "cash").length;
     return [
       { name: "Online", value: online, color: "hsl(var(--primary))" },
       { name: "Cash", value: cash, color: "hsl(142, 76%, 36%)" },
     ];
   };
 
   // Booking status breakdown
   const getStatusData = () => [
     { name: "Completed", value: filteredBookings.filter((b) => b.status === "completed").length, color: "hsl(142, 76%, 36%)" },
     { name: "In Progress", value: filteredBookings.filter((b) => b.status === "in_progress").length, color: "hsl(38, 92%, 50%)" },
     { name: "Requested", value: filteredBookings.filter((b) => b.status === "requested").length, color: "hsl(217, 91%, 60%)" },
     { name: "Cancelled", value: filteredBookings.filter((b) => b.status === "cancelled").length, color: "hsl(0, 84%, 60%)" },
   ];
 
   const getStatusBadge = (status: string) => {
     switch (status) {
       case "completed":
         return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Completed</Badge>;
       case "in_progress":
         return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">In Progress</Badge>;
       case "accepted":
         return <Badge className="bg-primary/10 text-primary border-primary/20">Accepted</Badge>;
       case "requested":
         return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Requested</Badge>;
       case "cancelled":
         return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Cancelled</Badge>;
       default:
         return <Badge variant="outline">{status}</Badge>;
     }
   };
 
   const getPaymentBadge = (status: string) => {
     switch (status) {
       case "paid":
         return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Paid</Badge>;
       case "pending":
         return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Pending</Badge>;
       case "failed":
         return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Failed</Badge>;
       default:
         return <Badge variant="outline">{status}</Badge>;
     }
   };
 
   const openBookingDetail = (booking: Booking) => {
     setSelectedBooking(booking);
     setIsDetailModalOpen(true);
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
 
   const revenueTrend = getRevenueTrend();
   const paymentMethodData = getPaymentMethodData();
   const statusData = getStatusData();
 
    return (
      <DashboardLayout isAdmin>
       <div className="space-y-6">
         {/* Header */}
         <div className="rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6">
           <h1 className="mb-2 text-2xl font-bold text-foreground">Bookings & Revenue</h1>
           <p className="text-muted-foreground">Track all platform bookings, payments, and commission</p>
         </div>
 
         {/* Revenue Stats */}
         <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
           <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5">
             <CardContent className="p-6">
               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-sm text-muted-foreground">Total Revenue</p>
                   <p className="text-2xl font-bold text-emerald-600">
                     ₹{totalRevenue >= 100000 ? `${(totalRevenue / 100000).toFixed(2)}L` : totalRevenue.toLocaleString()}
                   </p>
                   <div className="flex items-center gap-1 mt-1 text-xs text-emerald-600">
                     <ArrowUpRight className="h-3 w-3" />
                     <span>From {completedBookings.length} bookings</span>
                   </div>
                 </div>
                 <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20">
                   <IndianRupee className="h-6 w-6 text-emerald-600" />
                 </div>
               </div>
             </CardContent>
           </Card>
 
           <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5">
             <CardContent className="p-6">
               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-sm text-muted-foreground">Platform Commission</p>
                   <p className="text-2xl font-bold text-primary">
                     ₹{platformCommission >= 100000 ? `${(platformCommission / 100000).toFixed(2)}L` : platformCommission.toLocaleString()}
                   </p>
                   <div className="flex items-center gap-1 mt-1 text-xs text-primary">
                     <TrendingUp className="h-3 w-3" />
                     <span>{(PLATFORM_COMMISSION_RATE * 100).toFixed(0)}% of revenue</span>
                   </div>
                 </div>
                 <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
                   <PiggyBank className="h-6 w-6 text-primary" />
                 </div>
               </div>
             </CardContent>
           </Card>
 
           <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-blue-500/5">
             <CardContent className="p-6">
               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-sm text-muted-foreground">Provider Earnings</p>
                   <p className="text-2xl font-bold text-blue-600">
                     ₹{providerEarnings >= 100000 ? `${(providerEarnings / 100000).toFixed(2)}L` : providerEarnings.toLocaleString()}
                   </p>
                   <div className="flex items-center gap-1 mt-1 text-xs text-blue-600">
                     <Wallet className="h-3 w-3" />
                     <span>{((1 - PLATFORM_COMMISSION_RATE) * 100).toFixed(0)}% to providers</span>
                   </div>
                 </div>
                 <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20">
                   <Wallet className="h-6 w-6 text-blue-600" />
                 </div>
               </div>
             </CardContent>
           </Card>
 
           <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-amber-500/5">
             <CardContent className="p-6">
               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-sm text-muted-foreground">Pending Payments</p>
                   <p className="text-2xl font-bold text-amber-600">
                     ₹{pendingPayments >= 100000 ? `${(pendingPayments / 100000).toFixed(2)}L` : pendingPayments.toLocaleString()}
                   </p>
                   <div className="flex items-center gap-1 mt-1 text-xs text-amber-600">
                     <Clock className="h-3 w-3" />
                     <span>Awaiting payment</span>
                   </div>
                 </div>
                 <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20">
                   <CreditCard className="h-6 w-6 text-amber-600" />
                 </div>
               </div>
             </CardContent>
           </Card>
         </div>
 
         {/* Charts */}
         <div className="grid gap-6 lg:grid-cols-3">
           <Card className="lg:col-span-2">
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <TrendingUp className="h-5 w-5 text-primary" />
                 Revenue & Commission (Last 7 Days)
               </CardTitle>
             </CardHeader>
             <CardContent>
               <ResponsiveContainer width="100%" height={280}>
                 <LineChart data={revenueTrend}>
                   <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                   <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                   <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                   <Tooltip
                     contentStyle={{
                       backgroundColor: "hsl(var(--card))",
                       border: "1px solid hsl(var(--border))",
                       borderRadius: "8px",
                     }}
                     formatter={(value: number) => [`₹${value.toLocaleString()}`, ""]}
                   />
                   <Line type="monotone" dataKey="revenue" stroke="hsl(142, 76%, 36%)" strokeWidth={2} name="Revenue" />
                   <Line type="monotone" dataKey="commission" stroke="hsl(var(--primary))" strokeWidth={2} name="Commission" />
                 </LineChart>
               </ResponsiveContainer>
             </CardContent>
           </Card>
 
           <Card>
             <CardHeader>
               <CardTitle>Payment Methods</CardTitle>
             </CardHeader>
             <CardContent>
               {completedBookings.length === 0 ? (
                 <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                   No completed bookings
                 </div>
               ) : (
                 <>
                   <ResponsiveContainer width="100%" height={180}>
                     <PieChart>
                       <Pie
                         data={paymentMethodData}
                         cx="50%"
                         cy="50%"
                         innerRadius={45}
                         outerRadius={70}
                         paddingAngle={2}
                         dataKey="value"
                       >
                         {paymentMethodData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.color} />
                         ))}
                       </Pie>
                       <Tooltip
                         contentStyle={{
                           backgroundColor: "hsl(var(--card))",
                           border: "1px solid hsl(var(--border))",
                           borderRadius: "8px",
                         }}
                       />
                     </PieChart>
                   </ResponsiveContainer>
                   <div className="flex justify-center gap-4 mt-2">
                     {paymentMethodData.map((item) => (
                       <div key={item.name} className="flex items-center gap-2">
                         <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                         <span className="text-xs text-muted-foreground">
                           {item.name} ({item.value})
                         </span>
                       </div>
                     ))}
                   </div>
                 </>
               )}
             </CardContent>
           </Card>
         </div>
 
         {/* Booking Status Bar Chart */}
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <Calendar className="h-5 w-5 text-primary" />
               Booking Status Distribution
             </CardTitle>
           </CardHeader>
           <CardContent>
             <ResponsiveContainer width="100%" height={200}>
               <BarChart data={statusData} layout="horizontal">
                 <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                 <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                 <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                 <Tooltip
                   contentStyle={{
                     backgroundColor: "hsl(var(--card))",
                     border: "1px solid hsl(var(--border))",
                     borderRadius: "8px",
                   }}
                 />
                 <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                   {statusData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.color} />
                   ))}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
           </CardContent>
         </Card>
 
         {/* Filters */}
         <div className="flex flex-wrap gap-4">
           <div className="relative flex-1 min-w-[200px]">
             <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
             <Input
               placeholder="Search booking ID, service, customer..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="pl-10"
             />
           </div>
           <Select value={dateRange} onValueChange={setDateRange}>
             <SelectTrigger className="w-[150px]">
               <SelectValue placeholder="Date Range" />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="today">Today</SelectItem>
               <SelectItem value="this_week">This Week</SelectItem>
               <SelectItem value="this_month">This Month</SelectItem>
               <SelectItem value="last_month">Last Month</SelectItem>
               <SelectItem value="all">All Time</SelectItem>
             </SelectContent>
           </Select>
           <Select value={statusFilter} onValueChange={setStatusFilter}>
             <SelectTrigger className="w-[150px]">
               <SelectValue placeholder="Status" />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="all">All Status</SelectItem>
               <SelectItem value="requested">Requested</SelectItem>
               <SelectItem value="accepted">Accepted</SelectItem>
               <SelectItem value="in_progress">In Progress</SelectItem>
               <SelectItem value="completed">Completed</SelectItem>
               <SelectItem value="cancelled">Cancelled</SelectItem>
             </SelectContent>
           </Select>
           <Select value={paymentFilter} onValueChange={setPaymentFilter}>
             <SelectTrigger className="w-[150px]">
               <SelectValue placeholder="Payment" />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="all">All Payments</SelectItem>
               <SelectItem value="pending">Pending</SelectItem>
               <SelectItem value="paid">Paid</SelectItem>
               <SelectItem value="failed">Failed</SelectItem>
             </SelectContent>
           </Select>
         </div>
 
         {/* Bookings Table */}
         <Card>
           <CardHeader>
             <CardTitle>All Bookings ({filteredBookings.length})</CardTitle>
           </CardHeader>
           <CardContent>
             <Table>
               <TableHeader>
                 <TableRow>
                   <TableHead>Booking ID</TableHead>
                   <TableHead>Customer</TableHead>
                   <TableHead>Provider</TableHead>
                   <TableHead>Service</TableHead>
                   <TableHead>Date</TableHead>
                   <TableHead>Amount</TableHead>
                   <TableHead>Status</TableHead>
                   <TableHead>Payment</TableHead>
                   <TableHead className="text-right">Actions</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {filteredBookings.length === 0 ? (
                   <TableRow>
                     <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                       No bookings found
                     </TableCell>
                   </TableRow>
                 ) : (
                   filteredBookings.slice(0, 50).map((booking) => (
                     <TableRow key={booking.id}>
                       <TableCell className="font-mono text-sm">{booking.booking_id}</TableCell>
                       <TableCell className="text-sm">{getProfileName(booking.customer_id)}</TableCell>
                       <TableCell className="text-sm">{getProfileName(booking.provider_id)}</TableCell>
                       <TableCell>
                         <span className="capitalize text-sm">{booking.service_category.replace("-", " ")}</span>
                       </TableCell>
                       <TableCell className="text-sm text-muted-foreground">
                         {format(new Date(booking.scheduled_date), "MMM d")}
                       </TableCell>
                       <TableCell className="font-medium">₹{booking.total_amount.toLocaleString()}</TableCell>
                       <TableCell>{getStatusBadge(booking.status)}</TableCell>
                       <TableCell>{getPaymentBadge(booking.payment_status)}</TableCell>
                       <TableCell className="text-right">
                         <Button size="sm" variant="ghost" onClick={() => openBookingDetail(booking)}>
                           <Eye className="h-4 w-4" />
                         </Button>
                       </TableCell>
                     </TableRow>
                   ))
                 )}
               </TableBody>
             </Table>
             {filteredBookings.length > 50 && (
               <p className="mt-4 text-center text-sm text-muted-foreground">
                 Showing 50 of {filteredBookings.length} bookings
               </p>
             )}
           </CardContent>
         </Card>
 
         {/* Booking Detail Modal */}
         <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
           <DialogContent className="max-w-lg">
             <DialogHeader>
               <DialogTitle>Booking Details</DialogTitle>
               <DialogDescription>
                 {selectedBooking?.booking_id}
               </DialogDescription>
             </DialogHeader>
 
             {selectedBooking && (
               <div className="space-y-4">
                 <div className="grid gap-4 sm:grid-cols-2">
                   <div className="space-y-1">
                     <p className="text-xs text-muted-foreground">Customer</p>
                     <p className="font-medium">{getProfileName(selectedBooking.customer_id)}</p>
                   </div>
                   <div className="space-y-1">
                     <p className="text-xs text-muted-foreground">Provider</p>
                     <p className="font-medium">{getProfileName(selectedBooking.provider_id)}</p>
                   </div>
                   <div className="space-y-1">
                     <p className="text-xs text-muted-foreground">Service</p>
                     <p className="font-medium capitalize">{selectedBooking.service_category.replace("-", " ")}</p>
                   </div>
                   <div className="space-y-1">
                     <p className="text-xs text-muted-foreground">Scheduled</p>
                     <p className="font-medium">
                       {format(new Date(selectedBooking.scheduled_date), "MMM d, yyyy")} at {selectedBooking.scheduled_time}
                     </p>
                   </div>
                 </div>
 
                 <div className="border-t pt-4 space-y-2">
                   <div className="flex justify-between text-sm">
                     <span className="text-muted-foreground">Subtotal</span>
                     <span>₹{selectedBooking.subtotal.toLocaleString()}</span>
                   </div>
                   <div className="flex justify-between text-sm">
                     <span className="text-muted-foreground">Visit Charge</span>
                     <span>₹{selectedBooking.visit_charge.toLocaleString()}</span>
                   </div>
                   <div className="flex justify-between text-sm">
                     <span className="text-muted-foreground">Tax</span>
                     <span>₹{selectedBooking.tax.toLocaleString()}</span>
                   </div>
                   <div className="flex justify-between font-medium border-t pt-2">
                     <span>Total Amount</span>
                     <span>₹{selectedBooking.total_amount.toLocaleString()}</span>
                   </div>
                   <div className="flex justify-between text-sm text-primary">
                     <span>Platform Commission (15%)</span>
                     <span>₹{(selectedBooking.total_amount * PLATFORM_COMMISSION_RATE).toLocaleString()}</span>
                   </div>
                 </div>
 
                 <div className="flex gap-4">
                   <div className="flex-1 space-y-1">
                     <p className="text-xs text-muted-foreground">Booking Status</p>
                     {getStatusBadge(selectedBooking.status)}
                   </div>
                   <div className="flex-1 space-y-1">
                     <p className="text-xs text-muted-foreground">Payment Status</p>
                     {getPaymentBadge(selectedBooking.payment_status)}
                   </div>
                   <div className="flex-1 space-y-1">
                     <p className="text-xs text-muted-foreground">Payment Method</p>
                     <Badge variant="outline" className="capitalize">{selectedBooking.payment_method}</Badge>
                   </div>
                 </div>
 
                 {selectedBooking.customer_address && (
                   <div className="space-y-1">
                     <p className="text-xs text-muted-foreground">Service Address</p>
                     <p className="text-sm">{selectedBooking.customer_address}</p>
                   </div>
                 )}
 
                 {selectedBooking.notes && (
                   <div className="space-y-1">
                     <p className="text-xs text-muted-foreground">Notes</p>
                     <p className="text-sm">{selectedBooking.notes}</p>
                   </div>
                 )}
 
                 <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                   Created on {format(new Date(selectedBooking.created_at), "MMM d, yyyy 'at' h:mm a")}
                 </div>
               </div>
             )}
           </DialogContent>
         </Dialog>
       </div>
     </DashboardLayout>
   );
 };
 
 export default BookingsRevenue;