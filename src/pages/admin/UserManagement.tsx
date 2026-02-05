 import { useState, useEffect } from "react";
 import { useNavigate } from "react-router-dom";
 import DashboardLayout from "@/components/dashboard/DashboardLayout";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { Input } from "@/components/ui/input";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
 import { Textarea } from "@/components/ui/textarea";
 import {
   Users,
   UserCheck,
   Search,
   Loader2,
   CheckCircle2,
   XCircle,
   AlertCircle,
   Eye,
   Shield,
   ShieldOff,
   FileText,
   Clock,
   Mail,
   Phone,
   MapPin,
   Star,
   Briefcase,
 } from "lucide-react";
 import { format } from "date-fns";
 import { supabase } from "@/integrations/supabase/client";
 import { toast } from "sonner";
 import { createNotification } from "@/hooks/useNotifications";
 
interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string | null;
  mobile: string | null;
  is_provider: boolean;
  is_verified: boolean | null;
  kyc_status: string | null;
  primary_skill: string | null;
  service_location: string | null;
   average_rating: number | null;
   total_reviews: number | null;
   created_at: string;
 }
 
 interface KYCVerification {
   id: string;
   user_id: string;
   status: string;
   id_proof_type: string | null;
   id_proof_url: string | null;
   address_proof_type: string | null;
   address_proof_url: string | null;
   additional_certificates: string[] | null;
   submitted_at: string | null;
   rejection_reason: string | null;
   created_at: string;
 }
 
 const UserManagement = () => {
   const navigate = useNavigate();
   const [isLoading, setIsLoading] = useState(true);
   const [isAuthorized, setIsAuthorized] = useState(false);
   const [customers, setCustomers] = useState<Profile[]>([]);
   const [providers, setProviders] = useState<Profile[]>([]);
   const [kycVerifications, setKycVerifications] = useState<KYCVerification[]>([]);
   const [searchQuery, setSearchQuery] = useState("");
   const [activeTab, setActiveTab] = useState("customers");
 
   // KYC Review Modal
   const [selectedKYC, setSelectedKYC] = useState<KYCVerification | null>(null);
   const [selectedProvider, setSelectedProvider] = useState<Profile | null>(null);
   const [isKYCModalOpen, setIsKYCModalOpen] = useState(false);
   const [rejectionReason, setRejectionReason] = useState("");
   const [isProcessing, setIsProcessing] = useState(false);
 
   // Account Status Modal
   const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
   const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
   const [statusAction, setStatusAction] = useState<"activate" | "deactivate">("deactivate");
 
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
      // Fetch all users
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (usersError) throw usersError;

      const allUsers = usersData || [];
      setCustomers(allUsers.filter((u) => !u.is_provider));
      setProviders(allUsers.filter((u) => u.is_provider));
 
       // Fetch KYC verifications
       const { data: kycData, error: kycError } = await supabase
         .from("kyc_verifications")
         .select("*")
         .order("created_at", { ascending: false });
 
       if (kycError) throw kycError;
       setKycVerifications(kycData || []);
     } catch (error) {
       console.error("Error fetching data:", error);
       toast.error("Failed to load data");
     }
   };
 
   const handleKYCAction = async (action: "approve" | "reject") => {
     if (!selectedKYC) return;
 
     if (action === "reject" && !rejectionReason.trim()) {
       toast.error("Please provide a rejection reason");
       return;
     }
 
     setIsProcessing(true);
     try {
       const { data: { session } } = await supabase.auth.getSession();
 
       // Update KYC verification status
       const { error: kycError } = await supabase
         .from("kyc_verifications")
         .update({
           status: action === "approve" ? "approved" : "rejected",
           reviewed_at: new Date().toISOString(),
           reviewed_by: session?.user?.id,
           rejection_reason: action === "reject" ? rejectionReason : null,
         })
         .eq("id", selectedKYC.id);
 
       if (kycError) throw kycError;
 
      // Update provider in users table
      const { error: userError } = await supabase
        .from("users")
        .update({
          kyc_status: action === "approve" ? "approved" : "rejected",
          is_verified: action === "approve",
        })
        .eq("user_id", selectedKYC.user_id);
 
       if (userError) throw userError;
 
       // Send notification to provider
       await createNotification(
         selectedKYC.user_id,
         action === "approve" ? "KYC Approved! ✅" : "KYC Rejected",
         action === "approve"
           ? "Congratulations! Your KYC verification has been approved. You can now accept bookings."
           : `Your KYC verification was rejected. Reason: ${rejectionReason}`,
         "kyc",
         action === "approve" ? "/provider" : "/provider/kyc"
       );
 
       toast.success(`KYC ${action === "approve" ? "approved" : "rejected"} successfully`);
       setIsKYCModalOpen(false);
       setSelectedKYC(null);
       setSelectedProvider(null);
       setRejectionReason("");
       await fetchData();
     } catch (error) {
       console.error("Error updating KYC:", error);
       toast.error("Failed to update KYC status");
     } finally {
       setIsProcessing(false);
     }
   };
 
   const handleAccountStatus = async () => {
     if (!selectedUser) return;
 
     setIsProcessing(true);
     try {
      const { error } = await supabase
        .from("users")
        .update({
          is_verified: statusAction === "activate",
        })
        .eq("id", selectedUser.id);
 
       if (error) throw error;
 
       // Send notification to user
       await createNotification(
         selectedUser.user_id,
         statusAction === "activate" ? "Account Activated" : "Account Deactivated",
         statusAction === "activate"
           ? "Your account has been activated. You now have full access to the platform."
           : "Your account has been deactivated. Please contact support for assistance.",
         statusAction === "activate" ? "success" : "warning"
       );
 
       toast.success(`Account ${statusAction === "activate" ? "activated" : "deactivated"} successfully`);
       setIsStatusModalOpen(false);
       setSelectedUser(null);
       await fetchData();
     } catch (error) {
       console.error("Error updating account status:", error);
       toast.error("Failed to update account status");
     } finally {
       setIsProcessing(false);
     }
   };
 
   const openKYCReview = (kyc: KYCVerification) => {
     const provider = providers.find((p) => p.user_id === kyc.user_id);
     setSelectedKYC(kyc);
     setSelectedProvider(provider || null);
     setIsKYCModalOpen(true);
   };
 
   const openStatusModal = (user: Profile, action: "activate" | "deactivate") => {
     setSelectedUser(user);
     setStatusAction(action);
     setIsStatusModalOpen(true);
   };
 
   const getKYCStatusBadge = (status: string) => {
     switch (status) {
       case "approved":
         return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Approved</Badge>;
       case "rejected":
         return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Rejected</Badge>;
       case "submitted":
         return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Submitted</Badge>;
       default:
         return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Pending</Badge>;
     }
   };
 
   const filterBySearch = (items: Profile[]) => {
     if (!searchQuery.trim()) return items;
     const query = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.full_name.toLowerCase().includes(query) ||
        item.email?.toLowerCase().includes(query) ||
        item.mobile?.toLowerCase().includes(query)
    );
   };
 
   const pendingKYC = kycVerifications.filter((k) => k.status === "pending" || k.status === "submitted");
 
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
         <div className="rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6">
           <h1 className="mb-2 text-2xl font-bold text-foreground">User & Provider Management</h1>
           <p className="text-muted-foreground">Manage customers, service providers, and KYC verifications</p>
         </div>
 
         {/* Stats Cards */}
         <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
           <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-blue-500/5">
             <CardContent className="p-6">
               <div className="flex items-center gap-4">
                 <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20">
                   <Users className="h-6 w-6 text-blue-600" />
                 </div>
                 <div>
                   <p className="text-2xl font-bold text-blue-600">{customers.length}</p>
                   <p className="text-sm text-muted-foreground">Customers</p>
                 </div>
               </div>
             </CardContent>
           </Card>
           <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5">
             <CardContent className="p-6">
               <div className="flex items-center gap-4">
                 <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
                   <UserCheck className="h-6 w-6 text-primary" />
                 </div>
                 <div>
                   <p className="text-2xl font-bold text-primary">{providers.length}</p>
                   <p className="text-sm text-muted-foreground">Providers</p>
                 </div>
               </div>
             </CardContent>
           </Card>
           <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5">
             <CardContent className="p-6">
               <div className="flex items-center gap-4">
                 <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20">
                   <Shield className="h-6 w-6 text-emerald-600" />
                 </div>
                 <div>
                   <p className="text-2xl font-bold text-emerald-600">
                     {providers.filter((p) => p.is_verified).length}
                   </p>
                   <p className="text-sm text-muted-foreground">Verified Providers</p>
                 </div>
               </div>
             </CardContent>
           </Card>
           <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-amber-500/5">
             <CardContent className="p-6">
               <div className="flex items-center gap-4">
                 <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20">
                   <Clock className="h-6 w-6 text-amber-600" />
                 </div>
                 <div>
                   <p className="text-2xl font-bold text-amber-600">{pendingKYC.length}</p>
                   <p className="text-sm text-muted-foreground">Pending KYC</p>
                 </div>
               </div>
             </CardContent>
           </Card>
         </div>
 
         {/* Search */}
         <div className="relative">
           <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
           <Input
             placeholder="Search by name, email, or phone..."
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="pl-10"
           />
         </div>
 
         {/* Tabs */}
         <Tabs value={activeTab} onValueChange={setActiveTab}>
           <TabsList className="grid w-full grid-cols-3">
             <TabsTrigger value="customers" className="gap-2">
               <Users className="h-4 w-4" />
               Customers ({customers.length})
             </TabsTrigger>
             <TabsTrigger value="providers" className="gap-2">
               <UserCheck className="h-4 w-4" />
               Providers ({providers.length})
             </TabsTrigger>
             <TabsTrigger value="kyc" className="gap-2">
               <FileText className="h-4 w-4" />
               KYC Reviews ({pendingKYC.length})
             </TabsTrigger>
           </TabsList>
 
           {/* Customers Tab */}
           <TabsContent value="customers">
             <Card>
               <CardHeader>
                 <CardTitle>Customer Accounts</CardTitle>
               </CardHeader>
               <CardContent>
                 <Table>
                   <TableHeader>
                     <TableRow>
                       <TableHead>Name</TableHead>
                       <TableHead>Email</TableHead>
                       <TableHead>Phone</TableHead>
                       <TableHead>Joined</TableHead>
                       <TableHead>Status</TableHead>
                       <TableHead className="text-right">Actions</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {filterBySearch(customers).length === 0 ? (
                       <TableRow>
                         <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                           No customers found
                         </TableCell>
                       </TableRow>
                     ) : (
                       filterBySearch(customers).map((customer) => (
                         <TableRow key={customer.id}>
                           <TableCell className="font-medium">{customer.full_name}</TableCell>
                           <TableCell>
                             <div className="flex items-center gap-1 text-sm text-muted-foreground">
                               <Mail className="h-3 w-3" />
                               {customer.email || "—"}
                             </div>
                           </TableCell>
                           <TableCell>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {customer.mobile || "—"}
                            </div>
                           </TableCell>
                           <TableCell className="text-sm text-muted-foreground">
                             {format(new Date(customer.created_at), "MMM d, yyyy")}
                           </TableCell>
                           <TableCell>
                             {customer.is_verified ? (
                               <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Active</Badge>
                             ) : (
                               <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Inactive</Badge>
                             )}
                           </TableCell>
                           <TableCell className="text-right">
                             {customer.is_verified ? (
                               <Button
                                 size="sm"
                                 variant="ghost"
                                 className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                 onClick={() => openStatusModal(customer, "deactivate")}
                               >
                                 <ShieldOff className="h-4 w-4 mr-1" />
                                 Deactivate
                               </Button>
                             ) : (
                               <Button
                                 size="sm"
                                 variant="ghost"
                                 className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                 onClick={() => openStatusModal(customer, "activate")}
                               >
                                 <Shield className="h-4 w-4 mr-1" />
                                 Activate
                               </Button>
                             )}
                           </TableCell>
                         </TableRow>
                       ))
                     )}
                   </TableBody>
                 </Table>
               </CardContent>
             </Card>
           </TabsContent>
 
           {/* Providers Tab */}
           <TabsContent value="providers">
             <Card>
               <CardHeader>
                 <CardTitle>Service Provider Accounts</CardTitle>
               </CardHeader>
               <CardContent>
                 <Table>
                   <TableHeader>
                     <TableRow>
                       <TableHead>Name</TableHead>
                       <TableHead>Skill / Location</TableHead>
                       <TableHead>Rating</TableHead>
                       <TableHead>KYC Status</TableHead>
                       <TableHead>Status</TableHead>
                       <TableHead className="text-right">Actions</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {filterBySearch(providers).length === 0 ? (
                       <TableRow>
                         <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                           No providers found
                         </TableCell>
                       </TableRow>
                     ) : (
                       filterBySearch(providers).map((provider) => (
                         <TableRow key={provider.id}>
                           <TableCell>
                             <div>
                               <p className="font-medium">{provider.full_name}</p>
                               <p className="text-xs text-muted-foreground">{provider.email}</p>
                             </div>
                           </TableCell>
                           <TableCell>
                             <div className="space-y-1">
                               {provider.primary_skill && (
                                 <div className="flex items-center gap-1 text-sm">
                                   <Briefcase className="h-3 w-3 text-muted-foreground" />
                                   {provider.primary_skill}
                                 </div>
                               )}
                               {provider.service_location && (
                                 <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                   <MapPin className="h-3 w-3" />
                                   {provider.service_location}
                                 </div>
                               )}
                             </div>
                           </TableCell>
                           <TableCell>
                             <div className="flex items-center gap-1">
                               <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                               <span className="font-medium">{provider.average_rating || 0}</span>
                               <span className="text-xs text-muted-foreground">({provider.total_reviews || 0})</span>
                             </div>
                           </TableCell>
                           <TableCell>{getKYCStatusBadge(provider.kyc_status || "pending")}</TableCell>
                           <TableCell>
                             {provider.is_verified ? (
                               <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Verified</Badge>
                             ) : (
                               <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Unverified</Badge>
                             )}
                           </TableCell>
                           <TableCell className="text-right space-x-1">
                             {provider.is_verified ? (
                               <Button
                                 size="sm"
                                 variant="ghost"
                                 className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                 onClick={() => openStatusModal(provider, "deactivate")}
                               >
                                 <ShieldOff className="h-4 w-4" />
                               </Button>
                             ) : (
                               <Button
                                 size="sm"
                                 variant="ghost"
                                 className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                 onClick={() => openStatusModal(provider, "activate")}
                               >
                                 <Shield className="h-4 w-4" />
                               </Button>
                             )}
                           </TableCell>
                         </TableRow>
                       ))
                     )}
                   </TableBody>
                 </Table>
               </CardContent>
             </Card>
           </TabsContent>
 
           {/* KYC Tab */}
           <TabsContent value="kyc">
             <Card>
               <CardHeader>
                 <CardTitle>KYC Verification Queue</CardTitle>
               </CardHeader>
               <CardContent>
                 <Table>
                   <TableHeader>
                     <TableRow>
                       <TableHead>Provider</TableHead>
                       <TableHead>ID Proof</TableHead>
                       <TableHead>Address Proof</TableHead>
                       <TableHead>Submitted</TableHead>
                       <TableHead>Status</TableHead>
                       <TableHead className="text-right">Actions</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {kycVerifications.length === 0 ? (
                       <TableRow>
                         <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                           No KYC submissions yet
                         </TableCell>
                       </TableRow>
                     ) : (
                       kycVerifications.map((kyc) => {
                         const provider = providers.find((p) => p.user_id === kyc.user_id);
                         return (
                           <TableRow key={kyc.id}>
                             <TableCell>
                               <div>
                                 <p className="font-medium">{provider?.full_name || "Unknown"}</p>
                                 <p className="text-xs text-muted-foreground">{provider?.email}</p>
                               </div>
                             </TableCell>
                             <TableCell>
                               {kyc.id_proof_type ? (
                                 <Badge variant="outline">{kyc.id_proof_type}</Badge>
                               ) : (
                                 <span className="text-muted-foreground">—</span>
                               )}
                             </TableCell>
                             <TableCell>
                               {kyc.address_proof_type ? (
                                 <Badge variant="outline">{kyc.address_proof_type}</Badge>
                               ) : (
                                 <span className="text-muted-foreground">—</span>
                               )}
                             </TableCell>
                             <TableCell className="text-sm text-muted-foreground">
                               {kyc.submitted_at
                                 ? format(new Date(kyc.submitted_at), "MMM d, yyyy")
                                 : format(new Date(kyc.created_at), "MMM d, yyyy")}
                             </TableCell>
                             <TableCell>{getKYCStatusBadge(kyc.status)}</TableCell>
                             <TableCell className="text-right">
                               <Button
                                 size="sm"
                                 variant="outline"
                                 onClick={() => openKYCReview(kyc)}
                               >
                                 <Eye className="h-4 w-4 mr-1" />
                                 Review
                               </Button>
                             </TableCell>
                           </TableRow>
                         );
                       })
                     )}
                   </TableBody>
                 </Table>
               </CardContent>
             </Card>
           </TabsContent>
         </Tabs>
 
         {/* KYC Review Modal */}
         <Dialog open={isKYCModalOpen} onOpenChange={setIsKYCModalOpen}>
           <DialogContent className="max-w-2xl">
             <DialogHeader>
               <DialogTitle>Review KYC Verification</DialogTitle>
               <DialogDescription>
                 Review the submitted documents and approve or reject the verification
               </DialogDescription>
             </DialogHeader>
 
             {selectedKYC && (
               <div className="space-y-6">
                 {/* Provider Info */}
                 <div className="rounded-lg border border-border p-4">
                   <h4 className="font-medium mb-3">Provider Information</h4>
                   <div className="grid gap-3 sm:grid-cols-2">
                     <div className="flex items-center gap-2 text-sm">
                       <Users className="h-4 w-4 text-muted-foreground" />
                       <span>{selectedProvider?.full_name || "Unknown"}</span>
                     </div>
                     <div className="flex items-center gap-2 text-sm">
                       <Mail className="h-4 w-4 text-muted-foreground" />
                       <span>{selectedProvider?.email || "—"}</span>
                     </div>
                     <div className="flex items-center gap-2 text-sm">
                       <Briefcase className="h-4 w-4 text-muted-foreground" />
                       <span>{selectedProvider?.primary_skill || "—"}</span>
                     </div>
                     <div className="flex items-center gap-2 text-sm">
                       <MapPin className="h-4 w-4 text-muted-foreground" />
                       <span>{selectedProvider?.service_location || "—"}</span>
                     </div>
                   </div>
                 </div>
 
                 {/* Documents */}
                 <div className="space-y-4">
                   <h4 className="font-medium">Submitted Documents</h4>
                   <div className="grid gap-4 sm:grid-cols-2">
                     <div className="rounded-lg border border-border p-4">
                       <div className="flex items-center justify-between mb-2">
                         <span className="text-sm font-medium">ID Proof</span>
                         <Badge variant="outline">{selectedKYC.id_proof_type || "Not submitted"}</Badge>
                       </div>
                       {selectedKYC.id_proof_url ? (
                         <a
                           href={selectedKYC.id_proof_url}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="text-sm text-primary hover:underline flex items-center gap-1"
                         >
                           <FileText className="h-4 w-4" />
                           View Document
                         </a>
                       ) : (
                         <span className="text-sm text-muted-foreground">No document uploaded</span>
                       )}
                     </div>
                     <div className="rounded-lg border border-border p-4">
                       <div className="flex items-center justify-between mb-2">
                         <span className="text-sm font-medium">Address Proof</span>
                         <Badge variant="outline">{selectedKYC.address_proof_type || "Not submitted"}</Badge>
                       </div>
                       {selectedKYC.address_proof_url ? (
                         <a
                           href={selectedKYC.address_proof_url}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="text-sm text-primary hover:underline flex items-center gap-1"
                         >
                           <FileText className="h-4 w-4" />
                           View Document
                         </a>
                       ) : (
                         <span className="text-sm text-muted-foreground">No document uploaded</span>
                       )}
                     </div>
                   </div>
 
                   {selectedKYC.additional_certificates && selectedKYC.additional_certificates.length > 0 && (
                     <div className="rounded-lg border border-border p-4">
                       <span className="text-sm font-medium">Additional Certificates</span>
                       <div className="mt-2 flex flex-wrap gap-2">
                         {selectedKYC.additional_certificates.map((cert, idx) => (
                           <a
                             key={idx}
                             href={cert}
                             target="_blank"
                             rel="noopener noreferrer"
                             className="text-xs text-primary hover:underline"
                           >
                             Certificate {idx + 1}
                           </a>
                         ))}
                       </div>
                     </div>
                   )}
                 </div>
 
                 {/* Rejection Reason */}
                 {selectedKYC.status !== "approved" && (
                   <div className="space-y-2">
                     <label className="text-sm font-medium">Rejection Reason (required if rejecting)</label>
                     <Textarea
                       placeholder="Explain why the KYC is being rejected..."
                       value={rejectionReason}
                       onChange={(e) => setRejectionReason(e.target.value)}
                     />
                   </div>
                 )}
 
                 {/* Previous Rejection */}
                 {selectedKYC.rejection_reason && (
                   <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                     <div className="flex items-center gap-2 text-red-600 mb-2">
                       <AlertCircle className="h-4 w-4" />
                       <span className="text-sm font-medium">Previous Rejection Reason</span>
                     </div>
                     <p className="text-sm text-red-700">{selectedKYC.rejection_reason}</p>
                   </div>
                 )}
               </div>
             )}
 
             <DialogFooter className="gap-2">
               <Button variant="outline" onClick={() => setIsKYCModalOpen(false)} disabled={isProcessing}>
                 Cancel
               </Button>
               {selectedKYC?.status !== "approved" && (
                 <>
                   <Button
                     variant="destructive"
                     onClick={() => handleKYCAction("reject")}
                     disabled={isProcessing}
                   >
                     {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <XCircle className="h-4 w-4 mr-1" />}
                     Reject
                   </Button>
                   <Button
                     variant="default"
                     className="bg-emerald-600 hover:bg-emerald-700"
                     onClick={() => handleKYCAction("approve")}
                     disabled={isProcessing}
                   >
                     {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                     Approve
                   </Button>
                 </>
               )}
             </DialogFooter>
           </DialogContent>
         </Dialog>
 
         {/* Account Status Modal */}
         <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
           <DialogContent>
             <DialogHeader>
               <DialogTitle>
                 {statusAction === "activate" ? "Activate Account" : "Deactivate Account"}
               </DialogTitle>
               <DialogDescription>
                 {statusAction === "activate"
                   ? "This will allow the user to access all platform features."
                   : "This will restrict the user from accessing certain platform features."}
               </DialogDescription>
             </DialogHeader>
 
             {selectedUser && (
               <div className="rounded-lg border border-border p-4">
                 <div className="flex items-center gap-3">
                   <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                     <Users className="h-5 w-5 text-muted-foreground" />
                   </div>
                   <div>
                     <p className="font-medium">{selectedUser.full_name}</p>
                     <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                   </div>
                 </div>
               </div>
             )}
 
             <DialogFooter>
               <Button variant="outline" onClick={() => setIsStatusModalOpen(false)} disabled={isProcessing}>
                 Cancel
               </Button>
               <Button
                 variant={statusAction === "activate" ? "default" : "destructive"}
                 onClick={handleAccountStatus}
                 disabled={isProcessing}
               >
                 {isProcessing && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                 {statusAction === "activate" ? "Activate" : "Deactivate"}
               </Button>
             </DialogFooter>
           </DialogContent>
         </Dialog>
       </div>
     </DashboardLayout>
   );
 };
 
 export default UserManagement;