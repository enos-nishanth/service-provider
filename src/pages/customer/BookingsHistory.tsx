 import { useState, useEffect } from "react";
 import { Link, useNavigate } from "react-router-dom";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { Progress } from "@/components/ui/progress";
 import {
   Hexagon,
   ArrowLeft,
   Calendar,
   Clock,
   ChevronRight,
   Loader2,
   Package,
   User,
   CheckCircle2,
   PlayCircle,
   Clock3,
   XCircle,
   Star,
   Phone,
 } from "lucide-react";
 import { format } from "date-fns";
 import { cn } from "@/lib/utils";
 import { supabase } from "@/integrations/supabase/client";
 
 interface Booking {
   id: string;
   booking_id: string;
   provider_id: string;
   service_category: string;
   scheduled_date: string;
   scheduled_time: string;
   status: string;
   payment_method: string;
   payment_status: string;
   total_amount: number;
   created_at: string;
 }
 
interface ProviderInfo {
  full_name: string;
  mobile: string | null;
  avatar_url: string | null;
  average_rating: number | null;
}
 
 const statusConfig = {
   requested: {
     label: "Pending",
     icon: Clock3,
     color: "text-amber-600",
     bgColor: "bg-amber-500/10",
     borderColor: "border-amber-500/20",
     progress: 25,
   },
   accepted: {
     label: "Accepted",
     icon: CheckCircle2,
     color: "text-blue-600",
     bgColor: "bg-blue-500/10",
     borderColor: "border-blue-500/20",
     progress: 50,
   },
   in_progress: {
     label: "In Progress",
     icon: PlayCircle,
     color: "text-purple-600",
     bgColor: "bg-purple-500/10",
     borderColor: "border-purple-500/20",
     progress: 75,
   },
   completed: {
     label: "Completed",
     icon: CheckCircle2,
     color: "text-emerald-600",
     bgColor: "bg-emerald-500/10",
     borderColor: "border-emerald-500/20",
     progress: 100,
   },
   cancelled: {
     label: "Cancelled",
     icon: XCircle,
     color: "text-red-600",
     bgColor: "bg-red-500/10",
     borderColor: "border-red-500/20",
     progress: 0,
   },
 };
 
 const BookingsHistory = () => {
   const navigate = useNavigate();
   const [bookings, setBookings] = useState<Booking[]>([]);
   const [providerInfos, setProviderInfos] = useState<Record<string, ProviderInfo>>({});
   const [isLoading, setIsLoading] = useState(true);
   const [activeTab, setActiveTab] = useState("ongoing");
 
   useEffect(() => {
     fetchBookings();
 
     // Real-time subscription
     const channel = supabase
       .channel("bookings-list")
       .on(
         "postgres_changes",
         { event: "*", schema: "public", table: "bookings" },
         () => {
           fetchBookings();
         }
       )
       .subscribe();
 
     return () => {
       supabase.removeChannel(channel);
     };
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
         .eq("customer_id", user.id)
         .order("created_at", { ascending: false });
 
       if (error) throw error;
       setBookings(data || []);
 
       // Fetch provider info for each booking
       const providerIds = [...new Set(data?.map((b) => b.provider_id) || [])];
       for (const providerId of providerIds) {
        const { data: userData } = await supabase
          .from("users")
          .select("full_name, mobile, avatar_url, average_rating")
          .eq("user_id", providerId)
          .single();

        if (userData) {
          setProviderInfos((prev) => ({ ...prev, [providerId]: userData }));
         }
       }
     } catch (error) {
       console.error("Error fetching bookings:", error);
     } finally {
       setIsLoading(false);
     }
   };
 
   const getStatusConfig = (status: string) => {
     return statusConfig[status as keyof typeof statusConfig] || statusConfig.requested;
   };
 
   const filteredBookings = bookings.filter((booking) => {
     if (activeTab === "ongoing")
       return ["requested", "accepted", "in_progress"].includes(booking.status);
     if (activeTab === "completed") return booking.status === "completed";
     if (activeTab === "cancelled") return booking.status === "cancelled";
     return true;
   });
 
   const ongoingCount = bookings.filter((b) =>
     ["requested", "accepted", "in_progress"].includes(b.status)
   ).length;
   const completedCount = bookings.filter((b) => b.status === "completed").length;
 
   return (
     <div className="min-h-screen bg-background">
       {/* Header */}
       <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
         <div className="container mx-auto flex h-16 items-center justify-between px-4">
           <div className="flex items-center gap-4">
             <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
               <ArrowLeft className="h-5 w-5" />
             </Button>
             <div className="flex items-center gap-2">
               <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                 <Hexagon className="h-5 w-5 text-primary-foreground" fill="currentColor" />
               </div>
               <span className="text-xl font-bold text-foreground">
                 Handy<span className="text-primary">Hive</span>
               </span>
             </div>
           </div>
           <h1 className="text-lg font-semibold">Job Status</h1>
         </div>
       </header>
 
       <main className="container mx-auto px-4 py-6">
         {/* Stats Overview */}
         <div className="mb-6 grid grid-cols-2 gap-4">
           <Card className="border-blue-500/20 bg-blue-500/5">
             <CardContent className="flex items-center gap-4 p-4">
               <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
                 <PlayCircle className="h-6 w-6 text-blue-600" />
               </div>
               <div>
                 <p className="text-2xl font-bold text-blue-600">{ongoingCount}</p>
                 <p className="text-sm text-muted-foreground">Ongoing Jobs</p>
               </div>
             </CardContent>
           </Card>
           <Card className="border-emerald-500/20 bg-emerald-500/5">
             <CardContent className="flex items-center gap-4 p-4">
               <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                 <CheckCircle2 className="h-6 w-6 text-emerald-600" />
               </div>
               <div>
                 <p className="text-2xl font-bold text-emerald-600">{completedCount}</p>
                 <p className="text-sm text-muted-foreground">Completed</p>
               </div>
             </CardContent>
           </Card>
         </div>
 
         {/* Tabs */}
         <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
           <TabsList className="grid w-full grid-cols-3">
             <TabsTrigger value="ongoing" className="relative">
               Ongoing
               {ongoingCount > 0 && (
                 <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                   {ongoingCount}
                 </span>
               )}
             </TabsTrigger>
             <TabsTrigger value="completed">Completed</TabsTrigger>
             <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
           </TabsList>
         </Tabs>
 
         {isLoading ? (
           <div className="flex items-center justify-center py-12">
             <Loader2 className="h-8 w-8 animate-spin text-primary" />
           </div>
         ) : filteredBookings.length === 0 ? (
           <Card className="py-12">
             <CardContent className="flex flex-col items-center justify-center text-center">
               <Package className="mb-4 h-12 w-12 text-muted-foreground" />
               <h3 className="mb-2 text-lg font-semibold">No Jobs Found</h3>
               <p className="mb-6 text-muted-foreground">
                 {activeTab === "ongoing"
                   ? "You don't have any ongoing jobs"
                   : activeTab === "completed"
                   ? "No completed jobs yet"
                   : "No cancelled jobs"}
               </p>
                <Button asChild>
                  <Link to="/dashboard">Book a Service</Link>
               </Button>
             </CardContent>
           </Card>
         ) : (
           <div className="space-y-4">
             {filteredBookings.map((booking) => {
               const config = getStatusConfig(booking.status);
               const StatusIcon = config.icon;
               const provider = providerInfos[booking.provider_id];
 
               return (
                 <Link key={booking.id} to={`/booking/${booking.booking_id}`}>
                   <Card className="overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg">
                     <CardContent className="p-0">
                       {/* Progress Bar at Top */}
                       {booking.status !== "cancelled" && (
                         <div className="relative h-1.5 w-full bg-muted">
                           <div
                             className={cn(
                               "absolute left-0 top-0 h-full transition-all duration-500",
                               booking.status === "completed"
                                 ? "bg-emerald-500"
                                 : "bg-primary"
                             )}
                             style={{ width: `${config.progress}%` }}
                           />
                         </div>
                       )}
 
                       <div className="p-4">
                         {/* Status & Booking ID Row */}
                         <div className="mb-4 flex items-center justify-between">
                           <div className="flex items-center gap-3">
                             <div
                               className={cn(
                                 "flex h-10 w-10 items-center justify-center rounded-full",
                                 config.bgColor
                               )}
                             >
                               <StatusIcon className={cn("h-5 w-5", config.color)} />
                             </div>
                             <div>
                               <Badge
                                 className={cn(
                                   "mb-1 text-xs",
                                   config.bgColor,
                                   config.color,
                                   config.borderColor
                                 )}
                               >
                                 {config.label}
                               </Badge>
                               <p className="text-sm font-semibold text-foreground">
                                 {booking.booking_id}
                               </p>
                             </div>
                           </div>
                           <ChevronRight className="h-5 w-5 text-muted-foreground" />
                         </div>
 
                         {/* Service Category */}
                         <div className="mb-4 rounded-lg bg-accent/50 p-3">
                           <p className="text-sm font-medium capitalize text-foreground">
                             {booking.service_category.replace("-", " ")} Service
                           </p>
                           <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                             <span className="flex items-center gap-1">
                               <Calendar className="h-3.5 w-3.5" />
                               {format(new Date(booking.scheduled_date), "EEE, MMM d")}
                             </span>
                             <span className="flex items-center gap-1">
                               <Clock className="h-3.5 w-3.5" />
                               {booking.scheduled_time}
                             </span>
                           </div>
                         </div>
 
                         {/* Provider Info */}
                         <div className="flex items-center justify-between">
                           <div className="flex items-center gap-3">
                             <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                               {provider?.avatar_url ? (
                                 <img
                                   src={provider.avatar_url}
                                   alt={provider.full_name}
                                   className="h-10 w-10 rounded-full object-cover"
                                 />
                               ) : (
                                 <User className="h-5 w-5 text-primary" />
                               )}
                             </div>
                             <div>
                               <p className="text-sm font-medium text-foreground">
                                 {provider?.full_name || "Service Provider"}
                               </p>
                               {provider?.average_rating && provider.average_rating > 0 && (
                                 <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                   <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                   <span>{provider.average_rating.toFixed(1)}</span>
                                 </div>
                               )}
                             </div>
                           </div>
                           <div className="text-right">
                             <p className="text-lg font-bold text-primary">
                               ₹{booking.total_amount}
                             </p>
                             <Badge
                               variant={
                                 booking.payment_status === "paid" ? "default" : "secondary"
                               }
                               className="text-xs"
                             >
                               {booking.payment_status}
                             </Badge>
                           </div>
                         </div>
 
                         {/* Action Buttons for Active Jobs */}
                        {booking.status === "in_progress" && provider?.mobile && (
                          <div className="mt-4 flex gap-2 border-t border-border pt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={(e) => {
                                e.preventDefault();
                                window.location.href = `tel:${provider.mobile}`;
                               }}
                             >
                               <Phone className="mr-2 h-4 w-4" />
                               Call Provider
                             </Button>
                           </div>
                         )}
 
                         {/* Review Prompt for Completed Jobs */}
                         {booking.status === "completed" && (
                           <div className="mt-4 flex gap-2 border-t border-border pt-4">
                             <Button
                               size="sm"
                               className="flex-1"
                               onClick={(e) => {
                                 e.preventDefault();
                                 navigate(`/review/${booking.booking_id}`);
                               }}
                             >
                               <Star className="mr-2 h-4 w-4" />
                               Leave Review
                             </Button>
                           </div>
                         )}
                       </div>
                     </CardContent>
                   </Card>
                 </Link>
               );
             })}
           </div>
         )}
       </main>
     </div>
   );
 };
 
 export default BookingsHistory;