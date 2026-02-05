 import { useState, useEffect } from "react";
 import { useNavigate } from "react-router-dom";
 import DashboardLayout from "@/components/dashboard/DashboardLayout";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { Input } from "@/components/ui/input";
 import { Textarea } from "@/components/ui/textarea";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
   DialogFooter,
   DialogHeader,
   DialogTitle,
 } from "@/components/ui/dialog";
 import {
   AlertTriangle,
   Search,
   Loader2,
   Star,
   Flag,
   Shield,
   ShieldAlert,
   MessageSquare,
   Eye,
   CheckCircle2,
   XCircle,
   Clock,
   Users,
   AlertCircle,
   Ban,
   ShieldCheck,
 } from "lucide-react";
 import { format } from "date-fns";
 import { supabase } from "@/integrations/supabase/client";
 import { toast } from "sonner";
 
 interface Review {
   id: string;
   booking_id: string;
   customer_id: string;
   provider_id: string;
   rating: number;
   feedback: string | null;
   created_at: string;
 }
 
 interface Dispute {
   id: string;
   booking_id: string | null;
   reporter_id: string;
   reported_user_id: string;
   dispute_type: string;
   description: string;
   status: string;
   resolution: string | null;
   admin_notes: string | null;
   created_at: string;
 }
 
 interface FraudFlag {
   id: string;
   user_id: string;
   flag_type: string;
   reason: string;
   evidence: string | null;
   status: string;
   flagged_by: string;
   created_at: string;
 }
 
interface Profile {
  user_id: string;
  full_name: string;
  email: string | null;
  is_provider: boolean;
  is_verified: boolean | null;
  average_rating: number | null;
  total_reviews: number | null;
}
 
 const FraudMonitoring = () => {
   const navigate = useNavigate();
   const [isLoading, setIsLoading] = useState(true);
   const [isAuthorized, setIsAuthorized] = useState(false);
   const [currentUserId, setCurrentUserId] = useState<string | null>(null);
   const [reviews, setReviews] = useState<Review[]>([]);
   const [disputes, setDisputes] = useState<Dispute[]>([]);
   const [fraudFlags, setFraudFlags] = useState<FraudFlag[]>([]);
   const [profiles, setProfiles] = useState<Profile[]>([]);
   const [searchQuery, setSearchQuery] = useState("");
   const [activeTab, setActiveTab] = useState("reviews");
 
   // Modals
   const [isFlagModalOpen, setIsFlagModalOpen] = useState(false);
   const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
   const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
   const [selectedProvider, setSelectedProvider] = useState<Profile | null>(null);
 
   // Flag form
   const [flagType, setFlagType] = useState("fake_provider");
   const [flagReason, setFlagReason] = useState("");
   const [flagEvidence, setFlagEvidence] = useState("");
 
   // Dispute resolution
   const [resolution, setResolution] = useState("");
   const [adminNotes, setAdminNotes] = useState("");
   const [isProcessing, setIsProcessing] = useState(false);
 
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
 
         setCurrentUserId(session.user.id);
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
       // Fetch reviews
       const { data: reviewsData } = await supabase
         .from("reviews")
         .select("*")
         .order("created_at", { ascending: false });
       setReviews(reviewsData || []);
 
       // Fetch disputes
       const { data: disputesData } = await supabase
         .from("disputes")
         .select("*")
         .order("created_at", { ascending: false });
       setDisputes(disputesData || []);
 
       // Fetch fraud flags
       const { data: flagsData } = await supabase
         .from("fraud_flags")
         .select("*")
         .order("created_at", { ascending: false });
       setFraudFlags(flagsData || []);
 
      // Fetch users
      const { data: usersData } = await supabase
        .from("users")
        .select("user_id, full_name, email, is_provider, is_verified, average_rating, total_reviews");
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
 
   const getProfile = (userId: string) => {
     return profiles.find((p) => p.user_id === userId);
   };
 
   // Identify suspicious reviews (multiple 5-star or 1-star from same customer)
   const getSuspiciousReviews = () => {
     const customerReviewCounts: Record<string, { count: number; ratings: number[] }> = {};
     
     reviews.forEach((review) => {
       if (!customerReviewCounts[review.customer_id]) {
         customerReviewCounts[review.customer_id] = { count: 0, ratings: [] };
       }
       customerReviewCounts[review.customer_id].count++;
       customerReviewCounts[review.customer_id].ratings.push(review.rating);
     });
 
     return reviews.filter((review) => {
       const customerData = customerReviewCounts[review.customer_id];
       // Flag if: same customer left 3+ reviews, or all ratings are same (potential fake)
       const allSameRating = customerData.ratings.every((r) => r === customerData.ratings[0]);
       return customerData.count >= 3 || (customerData.count >= 2 && allSameRating);
     });
   };
 
   const handleCreateFlag = async () => {
     if (!selectedProvider || !flagReason.trim()) {
       toast.error("Please provide a reason for flagging");
       return;
     }
 
     setIsProcessing(true);
     try {
       const { error } = await supabase.from("fraud_flags").insert({
         user_id: selectedProvider.user_id,
         flag_type: flagType,
         reason: flagReason,
         evidence: flagEvidence || null,
         flagged_by: currentUserId,
       });
 
       if (error) throw error;
 
       toast.success("Provider flagged successfully");
       setIsFlagModalOpen(false);
       setSelectedProvider(null);
       setFlagReason("");
       setFlagEvidence("");
       await fetchData();
     } catch (error) {
       console.error("Error creating flag:", error);
       toast.error("Failed to flag provider");
     } finally {
       setIsProcessing(false);
     }
   };
 
   const handleUpdateFlagStatus = async (flagId: string, newStatus: string) => {
     setIsProcessing(true);
     try {
       const { error } = await supabase
         .from("fraud_flags")
         .update({
           status: newStatus,
           reviewed_by: currentUserId,
           reviewed_at: new Date().toISOString(),
         })
         .eq("id", flagId);
 
       if (error) throw error;
 
       // If banning, also update profile
       if (newStatus === "banned") {
         const flag = fraudFlags.find((f) => f.id === flagId);
         if (flag) {
          await supabase
            .from("users")
            .update({ is_verified: false })
            .eq("user_id", flag.user_id);
         }
       }
 
       toast.success(`Flag status updated to ${newStatus}`);
       await fetchData();
     } catch (error) {
       console.error("Error updating flag:", error);
       toast.error("Failed to update flag status");
     } finally {
       setIsProcessing(false);
     }
   };
 
   const handleResolveDispute = async (newStatus: "resolved" | "dismissed") => {
     if (!selectedDispute) return;
 
     if (newStatus === "resolved" && !resolution.trim()) {
       toast.error("Please provide a resolution");
       return;
     }
 
     setIsProcessing(true);
     try {
       const { error } = await supabase
         .from("disputes")
         .update({
           status: newStatus,
           resolution: resolution || null,
           admin_notes: adminNotes || null,
           resolved_by: currentUserId,
           resolved_at: new Date().toISOString(),
         })
         .eq("id", selectedDispute.id);
 
       if (error) throw error;
 
       toast.success(`Dispute ${newStatus} successfully`);
       setIsDisputeModalOpen(false);
       setSelectedDispute(null);
       setResolution("");
       setAdminNotes("");
       await fetchData();
     } catch (error) {
       console.error("Error resolving dispute:", error);
       toast.error("Failed to resolve dispute");
     } finally {
       setIsProcessing(false);
     }
   };
 
   const openFlagModal = (provider: Profile) => {
     setSelectedProvider(provider);
     setIsFlagModalOpen(true);
   };
 
   const openDisputeModal = (dispute: Dispute) => {
     setSelectedDispute(dispute);
     setResolution(dispute.resolution || "");
     setAdminNotes(dispute.admin_notes || "");
     setIsDisputeModalOpen(true);
   };
 
   const getDisputeTypeBadge = (type: string) => {
     const colors: Record<string, string> = {
       service_quality: "bg-blue-500/10 text-blue-600 border-blue-500/20",
       payment: "bg-purple-500/10 text-purple-600 border-purple-500/20",
       fraud: "bg-red-500/10 text-red-600 border-red-500/20",
       harassment: "bg-orange-500/10 text-orange-600 border-orange-500/20",
       other: "bg-muted text-muted-foreground border-border",
     };
     return <Badge className={colors[type] || colors.other}>{type.replace("_", " ")}</Badge>;
   };
 
   const getStatusBadge = (status: string) => {
     switch (status) {
       case "open":
         return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Open</Badge>;
       case "under_review":
         return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Under Review</Badge>;
       case "resolved":
         return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Resolved</Badge>;
       case "dismissed":
         return <Badge className="bg-muted text-muted-foreground border-border">Dismissed</Badge>;
       case "active":
         return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Active</Badge>;
       case "cleared":
         return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Cleared</Badge>;
       case "banned":
         return <Badge className="bg-foreground text-background">Banned</Badge>;
       default:
         return <Badge variant="outline">{status}</Badge>;
     }
   };
 
   const suspiciousReviews = getSuspiciousReviews();
   const openDisputes = disputes.filter((d) => d.status === "open" || d.status === "under_review");
   const activeFlags = fraudFlags.filter((f) => f.status === "active");
   const providers = profiles.filter((p) => p.is_provider);
 
   const filteredProviders = providers.filter((p) =>
     p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     p.email?.toLowerCase().includes(searchQuery.toLowerCase())
   );
 
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
 
    return (
      <DashboardLayout isAdmin>
       <div className="space-y-6">
         {/* Header */}
         <div className="rounded-2xl bg-gradient-to-r from-red-500/10 via-red-500/5 to-transparent p-6">
           <h1 className="mb-2 text-2xl font-bold text-foreground">Fraud & Review Monitoring</h1>
           <p className="text-muted-foreground">Monitor suspicious activity, manage disputes, and flag fraudulent users</p>
         </div>
 
         {/* Stats Cards */}
         <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
           <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-amber-500/5">
             <CardContent className="p-6">
               <div className="flex items-center gap-4">
                 <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20">
                   <AlertTriangle className="h-6 w-6 text-amber-600" />
                 </div>
                 <div>
                   <p className="text-2xl font-bold text-amber-600">{suspiciousReviews.length}</p>
                   <p className="text-sm text-muted-foreground">Suspicious Reviews</p>
                 </div>
               </div>
             </CardContent>
           </Card>
           <Card className="border-red-500/20 bg-gradient-to-br from-red-500/10 to-red-500/5">
             <CardContent className="p-6">
               <div className="flex items-center gap-4">
                 <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/20">
                   <Flag className="h-6 w-6 text-red-600" />
                 </div>
                 <div>
                   <p className="text-2xl font-bold text-red-600">{activeFlags.length}</p>
                   <p className="text-sm text-muted-foreground">Active Fraud Flags</p>
                 </div>
               </div>
             </CardContent>
           </Card>
           <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-blue-500/5">
             <CardContent className="p-6">
               <div className="flex items-center gap-4">
                 <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20">
                   <MessageSquare className="h-6 w-6 text-blue-600" />
                 </div>
                 <div>
                   <p className="text-2xl font-bold text-blue-600">{openDisputes.length}</p>
                   <p className="text-sm text-muted-foreground">Open Disputes</p>
                 </div>
               </div>
             </CardContent>
           </Card>
           <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5">
             <CardContent className="p-6">
               <div className="flex items-center gap-4">
                 <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20">
                   <Star className="h-6 w-6 text-emerald-600" />
                 </div>
                 <div>
                   <p className="text-2xl font-bold text-emerald-600">{reviews.length}</p>
                   <p className="text-sm text-muted-foreground">Total Reviews</p>
                 </div>
               </div>
             </CardContent>
           </Card>
         </div>
 
         {/* Tabs */}
         <Tabs value={activeTab} onValueChange={setActiveTab}>
           <TabsList className="grid w-full grid-cols-4">
             <TabsTrigger value="reviews" className="gap-2">
               <Star className="h-4 w-4" />
               Reviews
             </TabsTrigger>
             <TabsTrigger value="suspicious" className="gap-2">
               <AlertTriangle className="h-4 w-4" />
               Suspicious ({suspiciousReviews.length})
             </TabsTrigger>
             <TabsTrigger value="flags" className="gap-2">
               <Flag className="h-4 w-4" />
               Fraud Flags ({activeFlags.length})
             </TabsTrigger>
             <TabsTrigger value="disputes" className="gap-2">
               <MessageSquare className="h-4 w-4" />
               Disputes ({openDisputes.length})
             </TabsTrigger>
           </TabsList>
 
           {/* All Reviews Tab */}
           <TabsContent value="reviews">
             <Card>
               <CardHeader>
                 <CardTitle>All Reviews</CardTitle>
               </CardHeader>
               <CardContent>
                 <Table>
                   <TableHeader>
                     <TableRow>
                       <TableHead>Customer</TableHead>
                       <TableHead>Provider</TableHead>
                       <TableHead>Rating</TableHead>
                       <TableHead>Feedback</TableHead>
                       <TableHead>Date</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {reviews.length === 0 ? (
                       <TableRow>
                         <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                           No reviews yet
                         </TableCell>
                       </TableRow>
                     ) : (
                       reviews.slice(0, 50).map((review) => (
                         <TableRow key={review.id}>
                           <TableCell className="font-medium">{getProfileName(review.customer_id)}</TableCell>
                           <TableCell>{getProfileName(review.provider_id)}</TableCell>
                           <TableCell>
                             <div className="flex items-center gap-1">
                               {[...Array(5)].map((_, i) => (
                                 <Star
                                   key={i}
                                   className={`h-4 w-4 ${
                                     i < review.rating
                                       ? "fill-amber-400 text-amber-400"
                                       : "text-muted-foreground/30"
                                   }`}
                                 />
                               ))}
                             </div>
                           </TableCell>
                           <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                             {review.feedback || "—"}
                           </TableCell>
                           <TableCell className="text-sm text-muted-foreground">
                             {format(new Date(review.created_at), "MMM d, yyyy")}
                           </TableCell>
                         </TableRow>
                       ))
                     )}
                   </TableBody>
                 </Table>
               </CardContent>
             </Card>
           </TabsContent>
 
           {/* Suspicious Reviews Tab */}
           <TabsContent value="suspicious">
             <Card>
               <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <AlertTriangle className="h-5 w-5 text-amber-600" />
                   Suspicious Review Patterns
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 {suspiciousReviews.length === 0 ? (
                   <div className="flex flex-col items-center justify-center py-12 text-center">
                     <ShieldCheck className="h-12 w-12 text-emerald-500 mb-4" />
                     <p className="text-lg font-medium text-foreground">No Suspicious Reviews Detected</p>
                     <p className="text-sm text-muted-foreground">All reviews appear to be legitimate</p>
                   </div>
                 ) : (
                   <Table>
                     <TableHeader>
                       <TableRow>
                         <TableHead>Customer</TableHead>
                         <TableHead>Provider</TableHead>
                         <TableHead>Rating</TableHead>
                         <TableHead>Feedback</TableHead>
                         <TableHead>Risk Indicator</TableHead>
                         <TableHead className="text-right">Actions</TableHead>
                       </TableRow>
                     </TableHeader>
                     <TableBody>
                       {suspiciousReviews.map((review) => (
                         <TableRow key={review.id} className="bg-amber-500/5">
                           <TableCell className="font-medium">{getProfileName(review.customer_id)}</TableCell>
                           <TableCell>{getProfileName(review.provider_id)}</TableCell>
                           <TableCell>
                             <div className="flex items-center gap-1">
                               {[...Array(5)].map((_, i) => (
                                 <Star
                                   key={i}
                                   className={`h-4 w-4 ${
                                     i < review.rating
                                       ? "fill-amber-400 text-amber-400"
                                       : "text-muted-foreground/30"
                                   }`}
                                 />
                               ))}
                             </div>
                           </TableCell>
                           <TableCell className="max-w-[150px] truncate text-sm">
                             {review.feedback || "—"}
                           </TableCell>
                           <TableCell>
                             <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                               Multiple reviews
                             </Badge>
                           </TableCell>
                           <TableCell className="text-right">
                             <Button
                               size="sm"
                               variant="ghost"
                               className="text-red-600"
                               onClick={() => {
                                 const provider = getProfile(review.provider_id);
                                 if (provider) openFlagModal(provider);
                               }}
                             >
                               <Flag className="h-4 w-4 mr-1" />
                               Flag
                             </Button>
                           </TableCell>
                         </TableRow>
                       ))}
                     </TableBody>
                   </Table>
                 )}
               </CardContent>
             </Card>
           </TabsContent>
 
           {/* Fraud Flags Tab */}
           <TabsContent value="flags">
             <div className="space-y-4">
               {/* Search Providers to Flag */}
               <Card>
                 <CardHeader>
                   <CardTitle>Flag a Provider</CardTitle>
                 </CardHeader>
                 <CardContent>
                   <div className="relative mb-4">
                     <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                     <Input
                       placeholder="Search providers by name or email..."
                       value={searchQuery}
                       onChange={(e) => setSearchQuery(e.target.value)}
                       className="pl-10"
                     />
                   </div>
                   {searchQuery && (
                     <div className="max-h-[200px] overflow-y-auto border rounded-lg">
                       {filteredProviders.length === 0 ? (
                         <p className="p-4 text-center text-muted-foreground">No providers found</p>
                       ) : (
                         filteredProviders.slice(0, 10).map((provider) => (
                           <div
                             key={provider.user_id}
                             className="flex items-center justify-between p-3 border-b last:border-0 hover:bg-muted/50"
                           >
                             <div className="flex items-center gap-3">
                               <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                                 <Users className="h-4 w-4 text-muted-foreground" />
                               </div>
                               <div>
                                 <p className="font-medium text-sm">{provider.full_name}</p>
                                 <p className="text-xs text-muted-foreground">{provider.email}</p>
                               </div>
                             </div>
                             <Button size="sm" variant="outline" onClick={() => openFlagModal(provider)}>
                               <Flag className="h-4 w-4 mr-1" />
                               Flag
                             </Button>
                           </div>
                         ))
                       )}
                     </div>
                   )}
                 </CardContent>
               </Card>
 
               {/* Active Flags */}
               <Card>
                 <CardHeader>
                   <CardTitle>Fraud Flags</CardTitle>
                 </CardHeader>
                 <CardContent>
                   <Table>
                     <TableHeader>
                       <TableRow>
                         <TableHead>User</TableHead>
                         <TableHead>Flag Type</TableHead>
                         <TableHead>Reason</TableHead>
                         <TableHead>Status</TableHead>
                         <TableHead>Date</TableHead>
                         <TableHead className="text-right">Actions</TableHead>
                       </TableRow>
                     </TableHeader>
                     <TableBody>
                       {fraudFlags.length === 0 ? (
                         <TableRow>
                           <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                             No fraud flags yet
                           </TableCell>
                         </TableRow>
                       ) : (
                         fraudFlags.map((flag) => (
                           <TableRow key={flag.id}>
                             <TableCell className="font-medium">{getProfileName(flag.user_id)}</TableCell>
                             <TableCell>
                               <Badge variant="outline" className="capitalize">
                                 {flag.flag_type.replace("_", " ")}
                               </Badge>
                             </TableCell>
                             <TableCell className="max-w-[200px] truncate text-sm">
                               {flag.reason}
                             </TableCell>
                             <TableCell>{getStatusBadge(flag.status)}</TableCell>
                             <TableCell className="text-sm text-muted-foreground">
                               {format(new Date(flag.created_at), "MMM d, yyyy")}
                             </TableCell>
                             <TableCell className="text-right space-x-1">
                               {flag.status === "active" && (
                                 <>
                                   <Button
                                     size="sm"
                                     variant="ghost"
                                     className="text-emerald-600"
                                     onClick={() => handleUpdateFlagStatus(flag.id, "cleared")}
                                     disabled={isProcessing}
                                   >
                                     <ShieldCheck className="h-4 w-4" />
                                   </Button>
                                   <Button
                                     size="sm"
                                     variant="ghost"
                                     className="text-red-600"
                                     onClick={() => handleUpdateFlagStatus(flag.id, "banned")}
                                     disabled={isProcessing}
                                   >
                                     <Ban className="h-4 w-4" />
                                   </Button>
                                 </>
                               )}
                             </TableCell>
                           </TableRow>
                         ))
                       )}
                     </TableBody>
                   </Table>
                 </CardContent>
               </Card>
             </div>
           </TabsContent>
 
           {/* Disputes Tab */}
           <TabsContent value="disputes">
             <Card>
               <CardHeader>
                 <CardTitle>User Disputes</CardTitle>
               </CardHeader>
               <CardContent>
                 <Table>
                   <TableHeader>
                     <TableRow>
                       <TableHead>Reporter</TableHead>
                       <TableHead>Reported User</TableHead>
                       <TableHead>Type</TableHead>
                       <TableHead>Description</TableHead>
                       <TableHead>Status</TableHead>
                       <TableHead>Date</TableHead>
                       <TableHead className="text-right">Actions</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {disputes.length === 0 ? (
                       <TableRow>
                         <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                           No disputes yet
                         </TableCell>
                       </TableRow>
                     ) : (
                       disputes.map((dispute) => (
                         <TableRow key={dispute.id}>
                           <TableCell className="font-medium">{getProfileName(dispute.reporter_id)}</TableCell>
                           <TableCell>{getProfileName(dispute.reported_user_id)}</TableCell>
                           <TableCell>{getDisputeTypeBadge(dispute.dispute_type)}</TableCell>
                           <TableCell className="max-w-[150px] truncate text-sm">
                             {dispute.description}
                           </TableCell>
                           <TableCell>{getStatusBadge(dispute.status)}</TableCell>
                           <TableCell className="text-sm text-muted-foreground">
                             {format(new Date(dispute.created_at), "MMM d, yyyy")}
                           </TableCell>
                           <TableCell className="text-right">
                             <Button
                               size="sm"
                               variant="outline"
                               onClick={() => openDisputeModal(dispute)}
                             >
                               <Eye className="h-4 w-4" />
                             </Button>
                           </TableCell>
                         </TableRow>
                       ))
                     )}
                   </TableBody>
                 </Table>
               </CardContent>
             </Card>
           </TabsContent>
         </Tabs>
 
         {/* Flag Provider Modal */}
         <Dialog open={isFlagModalOpen} onOpenChange={setIsFlagModalOpen}>
           <DialogContent>
             <DialogHeader>
               <DialogTitle className="flex items-center gap-2">
                 <ShieldAlert className="h-5 w-5 text-red-600" />
                 Flag Provider
               </DialogTitle>
               <DialogDescription>
                 Flag {selectedProvider?.full_name} for fraudulent activity
               </DialogDescription>
             </DialogHeader>
 
             <div className="space-y-4">
               <div className="space-y-2">
                 <label className="text-sm font-medium">Flag Type</label>
                 <Select value={flagType} onValueChange={setFlagType}>
                   <SelectTrigger>
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="fake_provider">Fake Provider</SelectItem>
                     <SelectItem value="suspicious_reviews">Suspicious Reviews</SelectItem>
                     <SelectItem value="payment_fraud">Payment Fraud</SelectItem>
                     <SelectItem value="fake_bookings">Fake Bookings</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
 
               <div className="space-y-2">
                 <label className="text-sm font-medium">Reason *</label>
                 <Textarea
                   placeholder="Describe why this provider is being flagged..."
                   value={flagReason}
                   onChange={(e) => setFlagReason(e.target.value)}
                 />
               </div>
 
               <div className="space-y-2">
                 <label className="text-sm font-medium">Evidence (optional)</label>
                 <Textarea
                   placeholder="Add any supporting evidence..."
                   value={flagEvidence}
                   onChange={(e) => setFlagEvidence(e.target.value)}
                 />
               </div>
             </div>
 
             <DialogFooter>
               <Button variant="outline" onClick={() => setIsFlagModalOpen(false)}>
                 Cancel
               </Button>
               <Button
                 variant="destructive"
                 onClick={handleCreateFlag}
                 disabled={isProcessing || !flagReason.trim()}
               >
                 {isProcessing && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                 <Flag className="h-4 w-4 mr-1" />
                 Flag Provider
               </Button>
             </DialogFooter>
           </DialogContent>
         </Dialog>
 
         {/* Dispute Resolution Modal */}
         <Dialog open={isDisputeModalOpen} onOpenChange={setIsDisputeModalOpen}>
           <DialogContent className="max-w-lg">
             <DialogHeader>
               <DialogTitle>Handle Dispute</DialogTitle>
               <DialogDescription>
                 Review and resolve this dispute
               </DialogDescription>
             </DialogHeader>
 
             {selectedDispute && (
               <div className="space-y-4">
                 <div className="rounded-lg border border-border p-4 space-y-3">
                   <div className="flex justify-between">
                     <span className="text-sm text-muted-foreground">Reporter</span>
                     <span className="font-medium">{getProfileName(selectedDispute.reporter_id)}</span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-sm text-muted-foreground">Reported User</span>
                     <span className="font-medium">{getProfileName(selectedDispute.reported_user_id)}</span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-sm text-muted-foreground">Type</span>
                     {getDisputeTypeBadge(selectedDispute.dispute_type)}
                   </div>
                   <div className="flex justify-between">
                     <span className="text-sm text-muted-foreground">Status</span>
                     {getStatusBadge(selectedDispute.status)}
                   </div>
                 </div>
 
                 <div className="space-y-2">
                   <label className="text-sm font-medium">Description</label>
                   <p className="text-sm p-3 rounded-lg bg-muted">{selectedDispute.description}</p>
                 </div>
 
                 {selectedDispute.status !== "resolved" && selectedDispute.status !== "dismissed" && (
                   <>
                     <div className="space-y-2">
                       <label className="text-sm font-medium">Resolution</label>
                       <Textarea
                         placeholder="Describe how this dispute was resolved..."
                         value={resolution}
                         onChange={(e) => setResolution(e.target.value)}
                       />
                     </div>
 
                     <div className="space-y-2">
                       <label className="text-sm font-medium">Admin Notes (optional)</label>
                       <Textarea
                         placeholder="Internal notes..."
                         value={adminNotes}
                         onChange={(e) => setAdminNotes(e.target.value)}
                       />
                     </div>
                   </>
                 )}
 
                 {selectedDispute.resolution && (
                   <div className="space-y-2">
                     <label className="text-sm font-medium">Resolution</label>
                     <p className="text-sm p-3 rounded-lg bg-emerald-500/10 text-emerald-700">
                       {selectedDispute.resolution}
                     </p>
                   </div>
                 )}
               </div>
             )}
 
             <DialogFooter className="gap-2">
               <Button variant="outline" onClick={() => setIsDisputeModalOpen(false)}>
                 Close
               </Button>
               {selectedDispute?.status !== "resolved" && selectedDispute?.status !== "dismissed" && (
                 <>
                   <Button
                     variant="ghost"
                     onClick={() => handleResolveDispute("dismissed")}
                     disabled={isProcessing}
                   >
                     {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <XCircle className="h-4 w-4 mr-1" />}
                     Dismiss
                   </Button>
                   <Button
                     className="bg-emerald-600 hover:bg-emerald-700"
                     onClick={() => handleResolveDispute("resolved")}
                     disabled={isProcessing || !resolution.trim()}
                   >
                     {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                     Resolve
                   </Button>
                 </>
               )}
             </DialogFooter>
           </DialogContent>
         </Dialog>
       </div>
     </DashboardLayout>
   );
 };
 
 export default FraudMonitoring;