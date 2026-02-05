 import { useState, useEffect } from "react";
 import { useNavigate } from "react-router-dom";
 import DashboardLayout from "@/components/dashboard/DashboardLayout";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { Separator } from "@/components/ui/separator";
 import {
   Wallet,
   TrendingUp,
   CheckCircle2,
   Clock,
   IndianRupee,
   ArrowUpRight,
   ArrowDownRight,
   Calendar,
   Loader2,
   Receipt,
   CreditCard,
   Banknote,
 } from "lucide-react";
 import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval } from "date-fns";
 import { cn } from "@/lib/utils";
 import { supabase } from "@/integrations/supabase/client";
 
 interface Booking {
   id: string;
   booking_id: string;
   customer_id: string;
   service_category: string;
   scheduled_date: string;
   status: string;
   payment_method: string;
   payment_status: string;
   total_amount: number;
   created_at: string;
 }
 
 interface CustomerInfo {
   full_name: string;
 }
 
 const EarningsDashboard = () => {
   const navigate = useNavigate();
   const [bookings, setBookings] = useState<Booking[]>([]);
   const [customerInfos, setCustomerInfos] = useState<Record<string, CustomerInfo>>({});
   const [isLoading, setIsLoading] = useState(true);
   const [periodFilter, setPeriodFilter] = useState("all");
 
   useEffect(() => {
     fetchBookings();
   }, []);
 
   const fetchBookings = async () => {
     try {
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) {
         navigate("/auth");
         return;
       }
 
       const { data, error } = await supabase
         .from("bookings")
         .select("*")
         .eq("provider_id", user.id)
         .order("created_at", { ascending: false });
 
       if (error) throw error;
       setBookings(data || []);
 
       // Fetch customer info
       const customerIds = [...new Set(data?.map((b) => b.customer_id) || [])];
       for (const customerId of customerIds) {
        const { data: userData } = await supabase
          .from("users")
          .select("full_name")
          .eq("user_id", customerId)
          .single();

        if (userData) {
          setCustomerInfos((prev) => ({ ...prev, [customerId]: userData }));
         }
       }
     } catch (error) {
       console.error("Error fetching bookings:", error);
     } finally {
       setIsLoading(false);
     }
   };
 
   // Filter bookings by period
   const getFilteredBookings = () => {
     const now = new Date();
     return bookings.filter((booking) => {
       const bookingDate = new Date(booking.created_at);
       if (periodFilter === "this_month") {
         return isWithinInterval(bookingDate, {
           start: startOfMonth(now),
           end: endOfMonth(now),
         });
       }
       if (periodFilter === "last_month") {
         const lastMonth = subMonths(now, 1);
         return isWithinInterval(bookingDate, {
           start: startOfMonth(lastMonth),
           end: endOfMonth(lastMonth),
         });
       }
       return true;
     });
   };
 
   const filteredBookings = getFilteredBookings();
 
   // Calculate stats
   const completedBookings = filteredBookings.filter((b) => b.status === "completed");
   const totalEarnings = completedBookings.reduce((sum, b) => sum + b.total_amount, 0);
   const paidEarnings = completedBookings
     .filter((b) => b.payment_status === "paid")
     .reduce((sum, b) => sum + b.total_amount, 0);
   const pendingPayouts = completedBookings
     .filter((b) => b.payment_status === "pending")
     .reduce((sum, b) => sum + b.total_amount, 0);
   const completedJobsCount = completedBookings.length;
 
   // Calculate this month vs last month growth
   const thisMonthEarnings = bookings
     .filter((b) => {
       const bookingDate = new Date(b.created_at);
       return (
         b.status === "completed" &&
         isWithinInterval(bookingDate, {
           start: startOfMonth(new Date()),
           end: endOfMonth(new Date()),
         })
       );
     })
     .reduce((sum, b) => sum + b.total_amount, 0);
 
   const lastMonthEarnings = bookings
     .filter((b) => {
       const bookingDate = new Date(b.created_at);
       const lastMonth = subMonths(new Date(), 1);
       return (
         b.status === "completed" &&
         isWithinInterval(bookingDate, {
           start: startOfMonth(lastMonth),
           end: endOfMonth(lastMonth),
         })
       );
     })
     .reduce((sum, b) => sum + b.total_amount, 0);
 
   const growthPercentage =
     lastMonthEarnings > 0
       ? ((thisMonthEarnings - lastMonthEarnings) / lastMonthEarnings) * 100
       : thisMonthEarnings > 0
       ? 100
       : 0;
 
   // Transaction history (completed bookings as transactions)
   const transactions = filteredBookings
     .filter((b) => b.status === "completed")
     .slice(0, 10);
 
   const getPaymentMethodIcon = (method: string) => {
     switch (method) {
       case "online":
         return CreditCard;
       case "cod":
         return Banknote;
       default:
         return Receipt;
     }
   };
 
    if (isLoading) {
      return (
        <DashboardLayout isProvider activeMode="provider">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DashboardLayout>
      );
    }

    return (
      <DashboardLayout isProvider activeMode="provider">
       <div className="space-y-6">
         {/* Header */}
         <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
           <div>
             <h1 className="text-2xl font-bold text-foreground">Earnings Dashboard</h1>
             <p className="text-muted-foreground">Track your income and payouts</p>
           </div>
           <Tabs value={periodFilter} onValueChange={setPeriodFilter}>
             <TabsList>
               <TabsTrigger value="all">All Time</TabsTrigger>
               <TabsTrigger value="this_month">This Month</TabsTrigger>
               <TabsTrigger value="last_month">Last Month</TabsTrigger>
             </TabsList>
           </Tabs>
         </div>
 
         {/* Stats Cards */}
         <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
           {/* Total Earnings */}
           <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5">
             <CardContent className="p-6">
               <div className="flex items-center justify-between">
                 <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20">
                   <Wallet className="h-6 w-6 text-emerald-600" />
                 </div>
                 {growthPercentage !== 0 && periodFilter === "all" && (
                   <div
                     className={cn(
                       "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
                       growthPercentage > 0
                         ? "bg-emerald-500/10 text-emerald-600"
                         : "bg-red-500/10 text-red-600"
                     )}
                   >
                     {growthPercentage > 0 ? (
                       <ArrowUpRight className="h-3 w-3" />
                     ) : (
                       <ArrowDownRight className="h-3 w-3" />
                     )}
                     {Math.abs(growthPercentage).toFixed(1)}%
                   </div>
                 )}
               </div>
               <div className="mt-4">
                 <p className="text-sm text-muted-foreground">Total Earnings</p>
                 <p className="text-3xl font-bold text-emerald-600">
                   ₹{totalEarnings.toLocaleString()}
                 </p>
               </div>
             </CardContent>
           </Card>
 
           {/* Completed Jobs */}
           <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-blue-500/5">
             <CardContent className="p-6">
               <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/20">
                 <CheckCircle2 className="h-6 w-6 text-blue-600" />
               </div>
               <div className="mt-4">
                 <p className="text-sm text-muted-foreground">Completed Jobs</p>
                 <p className="text-3xl font-bold text-blue-600">{completedJobsCount}</p>
               </div>
             </CardContent>
           </Card>
 
           {/* Paid */}
           <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5">
             <CardContent className="p-6">
               <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                 <TrendingUp className="h-6 w-6 text-primary" />
               </div>
               <div className="mt-4">
                 <p className="text-sm text-muted-foreground">Received</p>
                 <p className="text-3xl font-bold text-primary">
                   ₹{paidEarnings.toLocaleString()}
                 </p>
               </div>
             </CardContent>
           </Card>
 
           {/* Pending Payouts */}
           <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-amber-500/5">
             <CardContent className="p-6">
               <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20">
                 <Clock className="h-6 w-6 text-amber-600" />
               </div>
               <div className="mt-4">
                 <p className="text-sm text-muted-foreground">Pending Payouts</p>
                 <p className="text-3xl font-bold text-amber-600">
                   ₹{pendingPayouts.toLocaleString()}
                 </p>
               </div>
             </CardContent>
           </Card>
         </div>
 
         {/* Earnings Breakdown & Transaction History */}
         <div className="grid gap-6 lg:grid-cols-2">
           {/* Earnings Breakdown */}
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <IndianRupee className="h-5 w-5 text-primary" />
                 Earnings Breakdown
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
               {/* Progress Bars */}
               <div className="space-y-4">
                 <div>
                   <div className="mb-2 flex items-center justify-between text-sm">
                     <span className="text-muted-foreground">Received</span>
                     <span className="font-medium text-primary">
                       ₹{paidEarnings.toLocaleString()}
                     </span>
                   </div>
                   <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                     <div
                       className="h-full bg-primary transition-all duration-500"
                       style={{
                         width: `${totalEarnings > 0 ? (paidEarnings / totalEarnings) * 100 : 0}%`,
                       }}
                     />
                   </div>
                 </div>
 
                 <div>
                   <div className="mb-2 flex items-center justify-between text-sm">
                     <span className="text-muted-foreground">Pending</span>
                     <span className="font-medium text-amber-600">
                       ₹{pendingPayouts.toLocaleString()}
                     </span>
                   </div>
                   <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                     <div
                       className="h-full bg-amber-500 transition-all duration-500"
                       style={{
                         width: `${totalEarnings > 0 ? (pendingPayouts / totalEarnings) * 100 : 0}%`,
                       }}
                     />
                   </div>
                 </div>
               </div>
 
               <Separator />
 
               {/* Payment Methods Summary */}
               <div className="grid grid-cols-2 gap-4">
                 <div className="rounded-lg bg-accent/50 p-4">
                   <div className="mb-2 flex items-center gap-2">
                     <CreditCard className="h-4 w-4 text-muted-foreground" />
                     <span className="text-sm text-muted-foreground">Online Payments</span>
                   </div>
                   <p className="text-xl font-bold text-foreground">
                     ₹
                     {completedBookings
                       .filter((b) => b.payment_method === "online")
                       .reduce((sum, b) => sum + b.total_amount, 0)
                       .toLocaleString()}
                   </p>
                 </div>
                 <div className="rounded-lg bg-accent/50 p-4">
                   <div className="mb-2 flex items-center gap-2">
                     <Banknote className="h-4 w-4 text-muted-foreground" />
                     <span className="text-sm text-muted-foreground">Cash Payments</span>
                   </div>
                   <p className="text-xl font-bold text-foreground">
                     ₹
                     {completedBookings
                       .filter((b) => b.payment_method === "cod")
                       .reduce((sum, b) => sum + b.total_amount, 0)
                       .toLocaleString()}
                   </p>
                 </div>
               </div>
             </CardContent>
           </Card>
 
           {/* Transaction History */}
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <Receipt className="h-5 w-5 text-primary" />
                 Recent Transactions
               </CardTitle>
             </CardHeader>
             <CardContent>
               {transactions.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-8 text-center">
                   <Receipt className="mb-4 h-12 w-12 text-muted-foreground" />
                   <p className="text-muted-foreground">No transactions yet</p>
                 </div>
               ) : (
                 <div className="space-y-3">
                   {transactions.map((transaction) => {
                     const PaymentIcon = getPaymentMethodIcon(transaction.payment_method);
                     const customer = customerInfos[transaction.customer_id];
 
                     return (
                       <div
                         key={transaction.id}
                         className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-accent/50"
                       >
                         <div className="flex items-center gap-3">
                           <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                             <PaymentIcon className="h-5 w-5 text-primary" />
                           </div>
                           <div>
                             <p className="text-sm font-medium text-foreground">
                               {customer?.full_name || "Customer"}
                             </p>
                             <div className="flex items-center gap-2 text-xs text-muted-foreground">
                               <span className="capitalize">
                                 {transaction.service_category.replace("-", " ")}
                               </span>
                               <span>•</span>
                               <span className="flex items-center gap-1">
                                 <Calendar className="h-3 w-3" />
                                 {format(new Date(transaction.scheduled_date), "MMM d")}
                               </span>
                             </div>
                           </div>
                         </div>
                         <div className="text-right">
                           <p className="font-semibold text-emerald-600">
                             +₹{transaction.total_amount}
                           </p>
                           <Badge
                             variant={
                               transaction.payment_status === "paid" ? "default" : "secondary"
                             }
                             className="text-xs"
                           >
                             {transaction.payment_status}
                           </Badge>
                         </div>
                       </div>
                     );
                   })}
                 </div>
               )}
             </CardContent>
           </Card>
         </div>
 
         {/* Monthly Summary */}
         <Card>
           <CardHeader>
             <CardTitle>Monthly Summary</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
               <div className="text-center">
                 <p className="text-3xl font-bold text-foreground">
                   {filteredBookings.length}
                 </p>
                 <p className="text-sm text-muted-foreground">Total Bookings</p>
               </div>
               <div className="text-center">
                 <p className="text-3xl font-bold text-emerald-600">{completedJobsCount}</p>
                 <p className="text-sm text-muted-foreground">Completed</p>
               </div>
               <div className="text-center">
                 <p className="text-3xl font-bold text-blue-600">
                   {filteredBookings.filter((b) => b.status === "in_progress").length}
                 </p>
                 <p className="text-sm text-muted-foreground">In Progress</p>
               </div>
               <div className="text-center">
                 <p className="text-3xl font-bold text-amber-600">
                   {filteredBookings.filter((b) => b.status === "requested").length}
                 </p>
                 <p className="text-sm text-muted-foreground">Pending</p>
               </div>
             </div>
           </CardContent>
         </Card>
       </div>
     </DashboardLayout>
   );
 };
 
 export default EarningsDashboard;