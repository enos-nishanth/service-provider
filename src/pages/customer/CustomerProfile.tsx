 import { useState, useEffect } from "react";
 import { Link, useNavigate } from "react-router-dom";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { Separator } from "@/components/ui/separator";
 import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
 import {
   Hexagon,
   ArrowLeft,
   User,
   Mail,
   Phone,
   Calendar,
   CreditCard,
   ChevronRight,
   LogOut,
   Settings,
   Clock,
   Package,
   Loader2,
   Edit,
 } from "lucide-react";
 import { format } from "date-fns";
 import { cn } from "@/lib/utils";
 import { supabase } from "@/integrations/supabase/client";
 import { useToast } from "@/hooks/use-toast";
 
interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string | null;
  mobile: string | null;
  avatar_url: string | null;
  is_provider: boolean;
  created_at: string;
}
 
 interface Booking {
   id: string;
   booking_id: string;
   service_category: string;
   scheduled_date: string;
   status: string;
   total_amount: number;
   payment_status: string;
   payment_method: string;
   created_at: string;
 }
 
 const CustomerProfile = () => {
   const navigate = useNavigate();
   const { toast } = useToast();
   const [profile, setProfile] = useState<Profile | null>(null);
   const [bookings, setBookings] = useState<Booking[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [isLoggingOut, setIsLoggingOut] = useState(false);
 
   useEffect(() => {
     const fetchData = async () => {
       try {
         const { data: { user } } = await supabase.auth.getUser();
         if (!user) {
           navigate("/auth");
           return;
         }
 
         // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from("users")
          .select("*")
          .eq("user_id", user.id)
          .single();
 
         if (profileError && profileError.code !== "PGRST116") {
           console.error("Profile error:", profileError);
         }
 
         if (profileData) {
           setProfile(profileData);
         } else {
           // Use user metadata if profile doesn't exist
           setProfile({
            id: "",
            user_id: user.id,
            full_name: user.user_metadata?.full_name || "User",
            email: user.email || null,
            mobile: user.user_metadata?.phone || null,
            avatar_url: null,
            is_provider: false,
            created_at: user.created_at,
          });
         }
 
         // Fetch bookings
         const { data: bookingsData } = await supabase
           .from("bookings")
           .select("*")
           .eq("customer_id", user.id)
           .order("created_at", { ascending: false })
           .limit(10);
 
         if (bookingsData) {
           setBookings(bookingsData);
         }
       } catch (error) {
         console.error("Error fetching data:", error);
       } finally {
         setIsLoading(false);
       }
     };
 
     fetchData();
   }, [navigate]);
 
   const handleLogout = async () => {
     setIsLoggingOut(true);
     try {
       await supabase.auth.signOut();
       toast({
         title: "Logged out",
         description: "You have been successfully logged out",
       });
       navigate("/auth");
     } catch (error: any) {
       toast({
         title: "Error",
         description: "Could not log out. Please try again.",
         variant: "destructive",
       });
     } finally {
       setIsLoggingOut(false);
     }
   };
 
   const getStatusColor = (status: string) => {
     switch (status) {
       case "requested":
         return "bg-amber-500/10 text-amber-600";
       case "accepted":
         return "bg-blue-500/10 text-blue-600";
       case "in_progress":
         return "bg-purple-500/10 text-purple-600";
       case "completed":
         return "bg-emerald-500/10 text-emerald-600";
       case "cancelled":
         return "bg-red-500/10 text-red-600";
       default:
         return "bg-muted text-muted-foreground";
     }
   };
 
   const getPaymentStatusColor = (status: string) => {
     switch (status) {
       case "paid":
         return "bg-emerald-500/10 text-emerald-600";
       case "pending":
         return "bg-amber-500/10 text-amber-600";
       case "failed":
         return "bg-red-500/10 text-red-600";
       default:
         return "bg-muted text-muted-foreground";
     }
   };
 
   // Calculate stats
   const totalBookings = bookings.length;
   const completedBookings = bookings.filter((b) => b.status === "completed").length;
   const totalSpent = bookings
     .filter((b) => b.payment_status === "paid")
     .reduce((sum, b) => sum + b.total_amount, 0);
 
   if (isLoading) {
     return (
       <div className="flex min-h-screen items-center justify-center bg-background">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
       </div>
     );
   }
 
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
           <h1 className="text-lg font-semibold">My Profile</h1>
         </div>
       </header>
 
       <main className="container mx-auto px-4 py-6">
         <div className="grid gap-6 lg:grid-cols-3">
           {/* Left Column - Profile Info */}
           <div className="space-y-6">
             {/* Profile Card */}
             <Card>
               <CardContent className="pt-6">
                 <div className="flex flex-col items-center text-center">
                   <Avatar className="h-24 w-24 mb-4">
                     <AvatarImage src={profile?.avatar_url || undefined} />
                     <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                       {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
                     </AvatarFallback>
                   </Avatar>
                   <h2 className="text-xl font-bold text-foreground">{profile?.full_name}</h2>
                  <Badge variant="secondary" className="mt-2 capitalize">
                    {profile?.is_provider ? "Provider" : "Customer"}
                  </Badge>
                   <p className="mt-2 text-sm text-muted-foreground">
                     Member since {profile?.created_at ? format(new Date(profile.created_at), "MMMM yyyy") : "N/A"}
                   </p>
                 </div>
 
                 <Separator className="my-6" />
 
                 {/* Contact Details */}
                 <div className="space-y-4">
                   <div className="flex items-center gap-3">
                     <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                       <Mail className="h-5 w-5 text-muted-foreground" />
                     </div>
                     <div>
                       <p className="text-xs text-muted-foreground">Email</p>
                       <p className="font-medium text-foreground">{profile?.email || "Not set"}</p>
                     </div>
                   </div>
                   <div className="flex items-center gap-3">
                     <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                       <Phone className="h-5 w-5 text-muted-foreground" />
                     </div>
                     <div>
                       <p className="text-xs text-muted-foreground">Phone</p>
                       <p className="font-medium text-foreground">{profile?.mobile || "Not set"}</p>
                     </div>
                   </div>
                 </div>
 
                 <Button variant="outline" className="mt-6 w-full gap-2">
                   <Edit className="h-4 w-4" />
                   Edit Profile
                 </Button>
               </CardContent>
             </Card>
 
             {/* Quick Stats */}
             <Card>
               <CardHeader>
                 <CardTitle className="text-base">Account Summary</CardTitle>
               </CardHeader>
               <CardContent className="grid grid-cols-3 gap-4 text-center">
                 <div>
                   <p className="text-2xl font-bold text-primary">{totalBookings}</p>
                   <p className="text-xs text-muted-foreground">Total Bookings</p>
                 </div>
                 <div>
                   <p className="text-2xl font-bold text-emerald-600">{completedBookings}</p>
                   <p className="text-xs text-muted-foreground">Completed</p>
                 </div>
                 <div>
                   <p className="text-2xl font-bold text-foreground">₹{totalSpent}</p>
                   <p className="text-xs text-muted-foreground">Total Spent</p>
                 </div>
               </CardContent>
             </Card>
 
             {/* Actions */}
             <Card>
               <CardContent className="pt-6 space-y-2">
                 <Button variant="outline" className="w-full justify-start gap-3" asChild>
                    <Link to="/bookings">
                     <Package className="h-4 w-4" />
                     View All Bookings
                     <ChevronRight className="ml-auto h-4 w-4" />
                   </Link>
                 </Button>
                 <Button variant="outline" className="w-full justify-start gap-3">
                   <Settings className="h-4 w-4" />
                   Account Settings
                   <ChevronRight className="ml-auto h-4 w-4" />
                 </Button>
                 <Separator className="my-2" />
                 <Button
                   variant="destructive"
                   className="w-full justify-start gap-3"
                   onClick={handleLogout}
                   disabled={isLoggingOut}
                 >
                   {isLoggingOut ? (
                     <Loader2 className="h-4 w-4 animate-spin" />
                   ) : (
                     <LogOut className="h-4 w-4" />
                   )}
                   {isLoggingOut ? "Logging out..." : "Logout"}
                 </Button>
               </CardContent>
             </Card>
           </div>
 
           {/* Right Column - History */}
           <div className="lg:col-span-2 space-y-6">
             {/* Booking History */}
             <Card>
               <CardHeader className="flex flex-row items-center justify-between">
                 <CardTitle className="flex items-center gap-2">
                   <Clock className="h-5 w-5 text-primary" />
                   Recent Bookings
                 </CardTitle>
                 <Button variant="ghost" size="sm" asChild>
                   <Link to="/bookings">View All</Link>
                 </Button>
               </CardHeader>
               <CardContent>
                 {bookings.length === 0 ? (
                   <div className="py-8 text-center">
                     <Package className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                     <p className="text-muted-foreground">No bookings yet</p>
                     <Button className="mt-4" size="sm" asChild>
                       <Link to="/dashboard">Book a Service</Link>
                     </Button>
                   </div>
                 ) : (
                   <div className="space-y-3">
                     {bookings.slice(0, 5).map((booking) => (
                       <Link
                         key={booking.id}
                         to={`/booking/${booking.booking_id}`}
                         className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-accent"
                       >
                         <div className="flex-1">
                           <div className="flex items-center gap-2">
                             <p className="font-medium text-foreground">{booking.booking_id}</p>
                             <Badge className={cn("text-xs", getStatusColor(booking.status))}>
                               {booking.status.replace("_", " ")}
                             </Badge>
                           </div>
                           <p className="text-sm capitalize text-muted-foreground">
                             {booking.service_category.replace("-", " ")}
                           </p>
                           <p className="text-xs text-muted-foreground">
                             {format(new Date(booking.scheduled_date), "MMM d, yyyy")}
                           </p>
                         </div>
                         <div className="text-right">
                           <p className="font-semibold text-foreground">₹{booking.total_amount}</p>
                           <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
                         </div>
                       </Link>
                     ))}
                   </div>
                 )}
               </CardContent>
             </Card>
 
             {/* Payment History */}
             <Card>
               <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <CreditCard className="h-5 w-5 text-primary" />
                   Payment History
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 {bookings.length === 0 ? (
                   <div className="py-8 text-center">
                     <CreditCard className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                     <p className="text-muted-foreground">No payments yet</p>
                   </div>
                 ) : (
                   <div className="space-y-3">
                     {bookings
                       .filter((b) => b.payment_status)
                       .slice(0, 5)
                       .map((booking) => (
                         <div
                           key={booking.id}
                           className="flex items-center justify-between rounded-lg border border-border p-3"
                         >
                           <div className="flex-1">
                             <div className="flex items-center gap-2">
                               <p className="font-medium text-foreground">{booking.booking_id}</p>
                               <Badge className={cn("text-xs", getPaymentStatusColor(booking.payment_status))}>
                                 {booking.payment_status}
                               </Badge>
                             </div>
                             <p className="text-sm capitalize text-muted-foreground">
                               {booking.payment_method}
                             </p>
                             <p className="text-xs text-muted-foreground">
                               {format(new Date(booking.created_at), "MMM d, yyyy 'at' h:mm a")}
                             </p>
                           </div>
                           <div className="text-right">
                             <p className="text-lg font-bold text-foreground">₹{booking.total_amount}</p>
                           </div>
                         </div>
                       ))}
                   </div>
                 )}
               </CardContent>
             </Card>
           </div>
         </div>
       </main>
     </div>
   );
 };
 
 export default CustomerProfile;