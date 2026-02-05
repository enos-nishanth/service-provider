 import { useState, useEffect } from "react";
 import { useParams, useNavigate, Link } from "react-router-dom";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { Separator } from "@/components/ui/separator";
 import {
   Hexagon,
   ArrowLeft,
   Calendar,
   Clock,
   MapPin,
   Phone,
   MessageSquare,
   CheckCircle2,
   Circle,
   Loader2,
   User,
   CreditCard,
   RefreshCw,
 } from "lucide-react";
 import { format } from "date-fns";
 import { cn } from "@/lib/utils";
 import { supabase } from "@/integrations/supabase/client";
 import { useToast } from "@/hooks/use-toast";
 
 type BookingStatus = "requested" | "accepted" | "in_progress" | "completed" | "cancelled";
 
 interface Booking {
   id: string;
   booking_id: string;
   service_category: string;
   scheduled_date: string;
   scheduled_time: string;
   status: string;
   payment_method: string;
   payment_status: string;
   subtotal: number;
   visit_charge: number;
   tax: number;
   total_amount: number;
   customer_address: string | null;
   created_at: string;
 }
 
 const statusSteps: { id: BookingStatus; label: string; description: string }[] = [
   { id: "requested", label: "Requested", description: "Waiting for provider confirmation" },
   { id: "accepted", label: "Accepted", description: "Provider has accepted your request" },
   { id: "in_progress", label: "In Progress", description: "Service is being performed" },
   { id: "completed", label: "Completed", description: "Service completed successfully" },
 ];
 
 const BookingDetail = () => {
   const { bookingId } = useParams();
   const navigate = useNavigate();
   const { toast } = useToast();
   const [booking, setBooking] = useState<Booking | null>(null);
   const [isLoading, setIsLoading] = useState(true);
 
   // Fetch booking details
   useEffect(() => {
     const fetchBooking = async () => {
       if (!bookingId) return;
 
       try {
         const { data, error } = await supabase
           .from("bookings")
           .select("*")
           .eq("booking_id", bookingId)
           .single();
 
         if (error) throw error;
         setBooking(data);
       } catch (error: any) {
         console.error("Error fetching booking:", error);
         toast({
           title: "Error",
           description: "Could not load booking details",
           variant: "destructive",
         });
       } finally {
         setIsLoading(false);
       }
     };
 
     fetchBooking();
   }, [bookingId, toast]);
 
   // Real-time subscription for booking updates
   useEffect(() => {
     if (!booking?.id) return;
 
     const channel = supabase
       .channel(`booking-${booking.id}`)
       .on(
         "postgres_changes",
         {
           event: "UPDATE",
           schema: "public",
           table: "bookings",
           filter: `id=eq.${booking.id}`,
         },
         (payload) => {
           console.log("Booking updated:", payload);
           setBooking(payload.new as Booking);
           
           const newStatus = (payload.new as Booking).status;
           toast({
             title: "Status Updated!",
             description: `Your booking is now: ${newStatus.replace("_", " ").toUpperCase()}`,
           });
         }
       )
       .subscribe();
 
     return () => {
       supabase.removeChannel(channel);
     };
   }, [booking?.id, toast]);
 
   const getCurrentStepIndex = () => {
     if (!booking) return 0;
     const index = statusSteps.findIndex((s) => s.id === booking.status);
     return index === -1 ? 0 : index;
   };
 
   const getStatusColor = (status: string) => {
     switch (status) {
       case "requested":
         return "bg-amber-500/10 text-amber-600 border-amber-500/20";
       case "accepted":
         return "bg-blue-500/10 text-blue-600 border-blue-500/20";
       case "in_progress":
         return "bg-purple-500/10 text-purple-600 border-purple-500/20";
       case "completed":
         return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
       case "cancelled":
         return "bg-red-500/10 text-red-600 border-red-500/20";
       default:
         return "bg-muted text-muted-foreground";
     }
   };
 
   if (isLoading) {
     return (
       <div className="flex min-h-screen items-center justify-center bg-background">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
       </div>
     );
   }
 
   if (!booking) {
     return (
       <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
         <h1 className="mb-4 text-2xl font-bold">Booking Not Found</h1>
         <p className="mb-6 text-muted-foreground">
           The booking you're looking for doesn't exist or you don't have access.
         </p>
         <Button asChild>
           <Link to="/dashboard">Go to Dashboard</Link>
         </Button>
       </div>
     );
   }
 
   const currentStepIndex = getCurrentStepIndex();
 
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
           <h1 className="text-lg font-semibold">Track Booking</h1>
         </div>
       </header>
 
       <main className="container mx-auto px-4 py-6">
         <div className="grid gap-6 lg:grid-cols-3">
           {/* Main Content */}
           <div className="lg:col-span-2 space-y-6">
             {/* Booking ID & Status */}
             <Card>
               <CardContent className="pt-6">
                 <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                   <div>
                     <p className="text-sm text-muted-foreground">Booking ID</p>
                     <p className="text-2xl font-bold text-primary">{booking.booking_id}</p>
                   </div>
                   <Badge className={cn("text-sm px-4 py-1", getStatusColor(booking.status))}>
                     {booking.status.replace("_", " ").toUpperCase()}
                   </Badge>
                 </div>
               </CardContent>
             </Card>
 
             {/* Status Timeline */}
             <Card>
               <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <RefreshCw className="h-5 w-5 text-primary" />
                   Live Status Tracking
                 </CardTitle>
                 <p className="text-sm text-muted-foreground">
                   Real-time updates on your service request
                 </p>
               </CardHeader>
               <CardContent>
                 <div className="relative">
                   {statusSteps.map((step, index) => {
                     const isCompleted = index < currentStepIndex;
                     const isCurrent = index === currentStepIndex;
                     const isPending = index > currentStepIndex;
 
                     return (
                       <div key={step.id} className="flex gap-4 pb-8 last:pb-0">
                         {/* Timeline Line & Icon */}
                         <div className="flex flex-col items-center">
                           <div
                             className={cn(
                               "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all",
                               isCompleted && "border-emerald-500 bg-emerald-500",
                               isCurrent && "border-primary bg-primary",
                               isPending && "border-muted-foreground/30 bg-background"
                             )}
                           >
                             {isCompleted ? (
                               <CheckCircle2 className="h-5 w-5 text-white" />
                             ) : isCurrent ? (
                               <div className="h-3 w-3 animate-pulse rounded-full bg-primary-foreground" />
                             ) : (
                               <Circle className="h-5 w-5 text-muted-foreground/50" />
                             )}
                           </div>
                           {index < statusSteps.length - 1 && (
                             <div
                               className={cn(
                                 "mt-2 h-full w-0.5 flex-1",
                                 isCompleted ? "bg-emerald-500" : "bg-muted"
                               )}
                             />
                           )}
                         </div>
 
                         {/* Step Content */}
                         <div className="flex-1 pb-2">
                           <h3
                             className={cn(
                               "font-semibold",
                               isCompleted && "text-emerald-600",
                               isCurrent && "text-primary",
                               isPending && "text-muted-foreground"
                             )}
                           >
                             {step.label}
                           </h3>
                           <p className="text-sm text-muted-foreground">{step.description}</p>
                           {isCurrent && (
                             <Badge variant="outline" className="mt-2 animate-pulse">
                               Current Status
                             </Badge>
                           )}
                         </div>
                       </div>
                     );
                   })}
                 </div>
               </CardContent>
             </Card>
 
             {/* Schedule & Payment Details */}
             <div className="grid gap-4 sm:grid-cols-2">
               <Card>
                 <CardHeader>
                   <CardTitle className="text-base flex items-center gap-2">
                     <Calendar className="h-4 w-4 text-primary" />
                     Schedule
                   </CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-3">
                   <div className="flex items-center gap-3">
                     <Calendar className="h-5 w-5 text-muted-foreground" />
                     <div>
                       <p className="text-sm text-muted-foreground">Date</p>
                       <p className="font-medium">
                         {format(new Date(booking.scheduled_date), "EEEE, MMMM d, yyyy")}
                       </p>
                     </div>
                   </div>
                   <div className="flex items-center gap-3">
                     <Clock className="h-5 w-5 text-muted-foreground" />
                     <div>
                       <p className="text-sm text-muted-foreground">Time</p>
                       <p className="font-medium">{booking.scheduled_time}</p>
                     </div>
                   </div>
                 </CardContent>
               </Card>
 
               <Card>
                 <CardHeader>
                   <CardTitle className="text-base flex items-center gap-2">
                     <CreditCard className="h-4 w-4 text-primary" />
                     Payment
                   </CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-3">
                   <div className="flex justify-between">
                     <span className="text-muted-foreground">Method</span>
                     <span className="font-medium capitalize">{booking.payment_method}</span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-muted-foreground">Status</span>
                     <Badge
                       variant={booking.payment_status === "paid" ? "default" : "secondary"}
                       className="capitalize"
                     >
                       {booking.payment_status}
                     </Badge>
                   </div>
                   <Separator />
                   <div className="flex justify-between text-lg font-bold">
                     <span>Total</span>
                     <span className="text-primary">₹{booking.total_amount}</span>
                   </div>
                 </CardContent>
               </Card>
             </div>
           </div>
 
           {/* Sidebar - Provider Details */}
           <div>
             <Card className="sticky top-24">
               <CardHeader>
                 <CardTitle className="text-base">Service Provider</CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                 {/* Provider Avatar & Info */}
                 <div className="flex items-center gap-4">
                   <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
                     <User className="h-8 w-8" />
                   </div>
                   <div>
                     <p className="font-semibold text-foreground">Service Provider</p>
                     <Badge variant="secondary" className="mt-1 capitalize">
                       {booking.service_category.replace("-", " ")}
                     </Badge>
                   </div>
                 </div>
 
                 <Separator />
 
                 {/* Contact Actions */}
                 <div className="space-y-2">
                   <Button variant="outline" className="w-full justify-start gap-2">
                     <Phone className="h-4 w-4" />
                     Call Provider
                   </Button>
                   <Button variant="outline" className="w-full justify-start gap-2">
                     <MessageSquare className="h-4 w-4" />
                     Send Message
                   </Button>
                 </div>
 
                 <Separator />
 
                 {/* Booking Info */}
                 <div className="space-y-2 text-sm">
                   <div className="flex justify-between">
                     <span className="text-muted-foreground">Booked On</span>
                     <span>{format(new Date(booking.created_at), "MMM d, yyyy")}</span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-muted-foreground">Service</span>
                     <span className="capitalize">{booking.service_category.replace("-", " ")}</span>
                   </div>
                 </div>
 
                 {booking.status === "completed" && (
                   <>
                     <Separator />
                     <Button className="w-full" asChild>
                       <Link to={`/review/${booking.booking_id}`}>Leave a Review</Link>
                     </Button>
                   </>
                 )}
 
                 {booking.status === "requested" && (
                   <>
                     <Separator />
                     <Button variant="destructive" className="w-full">
                       Cancel Booking
                     </Button>
                   </>
                 )}
               </CardContent>
             </Card>
           </div>
         </div>
       </main>
     </div>
   );
 };
 
 export default BookingDetail;