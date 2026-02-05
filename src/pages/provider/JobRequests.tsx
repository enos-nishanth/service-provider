 import { useState, useEffect } from "react";
 import { Link, useNavigate } from "react-router-dom";
 import DashboardLayout from "@/components/dashboard/DashboardLayout";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
 } from "@/components/ui/dialog";
 import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  Loader2,
  Package,
  CreditCard,
  MessageSquare,
  Shield,
  AlertCircle,
} from "lucide-react";
 import { format } from "date-fns";
 import { cn } from "@/lib/utils";
 import { supabase } from "@/integrations/supabase/client";
 import { useToast } from "@/hooks/use-toast";
 import { createNotification } from "@/hooks/useNotifications";
 
 interface Booking {
   id: string;
   booking_id: string;
   customer_id: string;
   service_category: string;
   scheduled_date: string;
   scheduled_time: string;
   status: string;
   payment_method: string;
   payment_status: string;
   total_amount: number;
   customer_address: string | null;
   notes: string | null;
   created_at: string;
 }
 
interface CustomerInfo {
  full_name: string;
  email: string | null;
  mobile: string | null;
}
 
const JobRequests = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [customerInfos, setCustomerInfos] = useState<Record<string, CustomerInfo>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("requested");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [kycStatus, setKycStatus] = useState<string | null>(null);

  const isKycApproved = kycStatus === "approved";

  useEffect(() => {
    fetchBookingsAndKyc();

    // Real-time subscription
    const channel = supabase
      .channel("provider-bookings")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        () => {
          fetchBookingsAndKyc();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
 
  const fetchBookingsAndKyc = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Fetch KYC status
      const { data: userData } = await supabase
        .from("users")
        .select("kyc_status")
        .eq("user_id", user.id)
        .single();

      if (userData) {
        setKycStatus(userData.kyc_status);
      }

      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("provider_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBookings(data || []);

      // Fetch customer info for each booking
      const customerIds = [...new Set(data?.map((b) => b.customer_id) || [])];
      for (const customerId of customerIds) {
        const { data: customerData } = await supabase
          .from("users")
          .select("full_name, email, mobile")
          .eq("user_id", customerId)
          .single();

        if (customerData) {
          setCustomerInfos((prev) => ({ ...prev, [customerId]: customerData }));
        }
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setIsLoading(false);
    }
  };
 
   const handleAccept = async (booking: Booking) => {
     setIsProcessing(true);
     try {
       const { error } = await supabase
         .from("bookings")
         .update({ status: "accepted" })
         .eq("id", booking.id);
 
       if (error) throw error;
 
       // Notify customer
       await createNotification(
         booking.customer_id,
         "Booking Accepted! ✅",
         `Your ${booking.service_category} booking for ${format(new Date(booking.scheduled_date), "MMM d")} has been accepted.`,
         "booking",
          `/booking/${booking.id}`
       );
 
       toast({
         title: "Booking Accepted",
         description: `You've accepted booking ${booking.booking_id}`,
       });
 
        fetchBookingsAndKyc();
     } catch (error: any) {
       toast({
         title: "Error",
         description: error.message,
         variant: "destructive",
       });
     } finally {
       setIsProcessing(false);
     }
   };
 
   const handleReject = async () => {
     if (!selectedBooking) return;
 
     setIsProcessing(true);
     try {
       const { error } = await supabase
         .from("bookings")
         .update({
           status: "cancelled",
           notes: rejectReason || "Rejected by provider",
         })
         .eq("id", selectedBooking.id);
 
       if (error) throw error;
 
       // Notify customer
       await createNotification(
         selectedBooking.customer_id,
         "Booking Declined",
         `Your ${selectedBooking.service_category} booking was declined. ${rejectReason ? `Reason: ${rejectReason}` : "Please try another provider."}`,
         "warning",
         `/bookings`
       );
 
       toast({
         title: "Booking Rejected",
         description: `You've rejected booking ${selectedBooking.booking_id}`,
       });
 
       setShowRejectDialog(false);
       setRejectReason("");
       setSelectedBooking(null);
        fetchBookingsAndKyc();
     } catch (error: any) {
       toast({
         title: "Error",
         description: error.message,
         variant: "destructive",
       });
     } finally {
       setIsProcessing(false);
     }
   };
 
   const handleStartJob = async (booking: Booking) => {
     setIsProcessing(true);
     try {
       const { error } = await supabase
         .from("bookings")
         .update({ status: "in_progress" })
         .eq("id", booking.id);
 
       if (error) throw error;
 
       // Notify customer
       await createNotification(
         booking.customer_id,
         "Service Started! 🔧",
         `Your ${booking.service_category} service is now in progress.`,
         "booking",
         `/booking/${booking.id}`
       );
 
       toast({
         title: "Job Started",
         description: "The customer has been notified",
       });
 
        fetchBookingsAndKyc();
     } catch (error: any) {
       toast({
         title: "Error",
         description: error.message,
         variant: "destructive",
       });
     } finally {
       setIsProcessing(false);
     }
   };
 
   const handleCompleteJob = async (booking: Booking) => {
     setIsProcessing(true);
     try {
       const { error } = await supabase
         .from("bookings")
         .update({
           status: "completed",
           payment_status: booking.payment_method === "cod" ? "paid" : booking.payment_status,
         })
         .eq("id", booking.id);
 
       if (error) throw error;
 
       // Notify customer to leave review
       await createNotification(
         booking.customer_id,
         "Service Completed! ⭐",
         `Your ${booking.service_category} service is complete. Please leave a review!`,
         "review",
         `/review/${booking.id}`
       );
 
       toast({
         title: "Job Completed!",
         description: "Great work! The customer can now leave a review.",
       });
 
       fetchBookingsAndKyc();
     } catch (error: any) {
       toast({
         title: "Error",
         description: error.message,
         variant: "destructive",
       });
     } finally {
       setIsProcessing(false);
     }
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
 
   const filteredBookings = bookings.filter((booking) => {
     if (activeTab === "requested") return booking.status === "requested";
     if (activeTab === "accepted") return booking.status === "accepted";
     if (activeTab === "in_progress") return booking.status === "in_progress";
     if (activeTab === "completed") return booking.status === "completed";
     if (activeTab === "cancelled") return booking.status === "cancelled";
     return true;
   });
 
   const requestedCount = bookings.filter((b) => b.status === "requested").length;
 
    return (
      <DashboardLayout isProvider activeMode="provider">
       <div className="space-y-6">
         <div>
           <h1 className="text-2xl font-bold text-foreground">Job Requests</h1>
           <p className="text-muted-foreground">Manage your incoming and ongoing bookings</p>
         </div>

         {/* KYC Warning Banner */}
         {!isKycApproved && (
           <div className={`flex items-center justify-between rounded-xl p-4 ${
             kycStatus === "rejected" 
               ? "border border-destructive/30 bg-destructive/10" 
               : "border border-amber-300 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10"
           }`}>
             <div className="flex items-center gap-3">
               {kycStatus === "rejected" ? (
                 <AlertCircle className="h-5 w-5 text-destructive" />
               ) : (
                 <Shield className="h-5 w-5 text-amber-600" />
               )}
               <div>
                 <p className="font-medium text-foreground">
                   {!kycStatus && "Complete KYC to Accept Jobs"}
                   {kycStatus === "pending" && "KYC Verification Pending"}
                   {kycStatus === "under_review" && "KYC Under Review"}
                   {kycStatus === "rejected" && "KYC Verification Rejected"}
                 </p>
                 <p className="text-sm text-muted-foreground">
                   You cannot accept job requests until your KYC is approved.
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
 
         {/* Tabs */}
         <Tabs value={activeTab} onValueChange={setActiveTab}>
           <TabsList className="grid w-full grid-cols-5">
             <TabsTrigger value="requested" className="relative">
               New
               {requestedCount > 0 && (
                 <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                   {requestedCount}
                 </span>
               )}
             </TabsTrigger>
             <TabsTrigger value="accepted">Accepted</TabsTrigger>
             <TabsTrigger value="in_progress">In Progress</TabsTrigger>
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
               <h3 className="mb-2 text-lg font-semibold">No {activeTab.replace("_", " ")} bookings</h3>
               <p className="text-muted-foreground">
                 {activeTab === "requested"
                   ? "You don't have any new booking requests"
                   : `No bookings with ${activeTab.replace("_", " ")} status`}
               </p>
             </CardContent>
           </Card>
         ) : (
           <div className="space-y-4">
             {filteredBookings.map((booking) => {
               const customer = customerInfos[booking.customer_id];
               return (
                 <Card key={booking.id} className="overflow-hidden">
                   <CardContent className="p-0">
                     <div className="flex flex-col lg:flex-row">
                       {/* Main Info */}
                       <div className="flex-1 p-5">
                         <div className="mb-4 flex flex-wrap items-center gap-3">
                           <p className="text-lg font-bold text-primary">{booking.booking_id}</p>
                           <Badge className={cn("text-xs", getStatusColor(booking.status))}>
                             {booking.status.replace("_", " ").toUpperCase()}
                           </Badge>
                           <Badge variant="outline" className="capitalize">
                             {booking.service_category.replace("-", " ")}
                           </Badge>
                         </div>
 
                         {/* Customer Details */}
                         <div className="mb-4 rounded-lg bg-accent/50 p-3">
                           <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                             Customer Details
                           </p>
                           <div className="grid gap-2 sm:grid-cols-2">
                             <div className="flex items-center gap-2">
                               <User className="h-4 w-4 text-muted-foreground" />
                               <span className="font-medium">{customer?.full_name || "Customer"}</span>
                             </div>
                            {customer?.mobile && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span>{customer.mobile}</span>
                              </div>
                             )}
                             {customer?.email && (
                               <div className="flex items-center gap-2">
                                 <Mail className="h-4 w-4 text-muted-foreground" />
                                 <span className="truncate">{customer.email}</span>
                               </div>
                             )}
                           </div>
                         </div>
 
                         {/* Schedule & Payment */}
                         <div className="grid gap-4 sm:grid-cols-2">
                           <div className="space-y-2">
                             <div className="flex items-center gap-2 text-sm">
                               <Calendar className="h-4 w-4 text-muted-foreground" />
                               <span>{format(new Date(booking.scheduled_date), "EEEE, MMM d, yyyy")}</span>
                             </div>
                             <div className="flex items-center gap-2 text-sm">
                               <Clock className="h-4 w-4 text-muted-foreground" />
                               <span>{booking.scheduled_time}</span>
                             </div>
                           </div>
                           <div className="space-y-2">
                             <div className="flex items-center gap-2 text-sm">
                               <CreditCard className="h-4 w-4 text-muted-foreground" />
                               <span className="capitalize">{booking.payment_method}</span>
                               <Badge variant={booking.payment_status === "paid" ? "default" : "secondary"} className="text-xs">
                                 {booking.payment_status}
                               </Badge>
                             </div>
                             <div className="text-lg font-bold text-foreground">₹{booking.total_amount}</div>
                           </div>
                         </div>
 
                         {booking.notes && (
                           <div className="mt-4 flex items-start gap-2 rounded-lg border border-border p-3 text-sm">
                             <MessageSquare className="mt-0.5 h-4 w-4 text-muted-foreground" />
                             <p className="text-muted-foreground">{booking.notes}</p>
                           </div>
                         )}
                       </div>
 
                       {/* Action Buttons */}
                       <div className="flex flex-row gap-2 border-t border-border bg-muted/30 p-4 lg:w-48 lg:flex-col lg:border-l lg:border-t-0">
                          {booking.status === "requested" && (
                            <>
                              <div className="flex flex-col gap-1">
                                <Button
                                  className="flex-1"
                                  onClick={() => handleAccept(booking)}
                                  disabled={isProcessing || !isKycApproved}
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Accept
                                </Button>
                                {!isKycApproved && (
                                  <p className="text-xs text-center text-muted-foreground">
                                    Complete KYC to accept
                                  </p>
                                )}
                              </div>
                             <Button
                               variant="outline"
                               className="flex-1"
                               onClick={() => {
                                 setSelectedBooking(booking);
                                 setShowRejectDialog(true);
                               }}
                               disabled={isProcessing}
                             >
                               <XCircle className="mr-2 h-4 w-4" />
                               Reject
                             </Button>
                           </>
                         )}
 
                         {booking.status === "accepted" && (
                           <>
                             <Button
                               className="flex-1"
                               onClick={() => handleStartJob(booking)}
                               disabled={isProcessing}
                             >
                               Start Job
                             </Button>
                             <Button variant="outline" className="flex-1">
                               <Phone className="mr-2 h-4 w-4" />
                               Call
                             </Button>
                           </>
                         )}
 
                         {booking.status === "in_progress" && (
                           <Button
                             className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                             onClick={() => handleCompleteJob(booking)}
                             disabled={isProcessing}
                           >
                             <CheckCircle className="mr-2 h-4 w-4" />
                             Complete Job
                           </Button>
                         )}
 
                         {booking.status === "completed" && (
                           <div className="flex flex-col items-center justify-center text-center">
                             <CheckCircle className="mb-2 h-8 w-8 text-emerald-500" />
                             <p className="text-sm text-muted-foreground">Job Completed</p>
                           </div>
                         )}
 
                         {booking.status === "cancelled" && (
                           <div className="flex flex-col items-center justify-center text-center">
                             <XCircle className="mb-2 h-8 w-8 text-red-500" />
                             <p className="text-sm text-muted-foreground">Cancelled</p>
                           </div>
                         )}
                       </div>
                     </div>
                   </CardContent>
                 </Card>
               );
             })}
           </div>
         )}
 
         {/* Reject Dialog */}
         <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
           <DialogContent>
             <DialogHeader>
               <DialogTitle>Reject Booking</DialogTitle>
               <DialogDescription>
                 Are you sure you want to reject this booking? The customer will be notified.
               </DialogDescription>
             </DialogHeader>
             <div className="space-y-4">
               <div>
                 <p className="mb-2 text-sm font-medium">Reason (optional)</p>
                 <Textarea
                   placeholder="Let the customer know why you're rejecting..."
                   value={rejectReason}
                   onChange={(e) => setRejectReason(e.target.value)}
                   rows={3}
                 />
               </div>
             </div>
             <DialogFooter>
               <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                 Cancel
               </Button>
               <Button
                 variant="destructive"
                 onClick={handleReject}
                 disabled={isProcessing}
               >
                 {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                 Reject Booking
               </Button>
             </DialogFooter>
           </DialogContent>
         </Dialog>
       </div>
     </DashboardLayout>
   );
 };
 
 export default JobRequests;