 import { useState, useEffect } from "react";
 import { Link, useNavigate } from "react-router-dom";
 import { Button } from "@/components/ui/button";
 import { Label } from "@/components/ui/label";
 import { Badge } from "@/components/ui/badge";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { useToast } from "@/hooks/use-toast";
 import { supabase } from "@/integrations/supabase/client";
 import { 
   Hexagon, 
   Upload, 
   FileText, 
   CheckCircle2, 
   XCircle, 
   Clock, 
   AlertCircle,
   ArrowLeft,
   Loader2,
   Shield,
   CreditCard,
   MapPin,
   Award,
   X,
   Eye
 } from "lucide-react";
 
 type KYCStatus = 'pending' | 'under_review' | 'approved' | 'rejected';
 
 interface KYCData {
   id: string;
   status: KYCStatus;
   id_proof_url: string | null;
   id_proof_type: string | null;
   address_proof_url: string | null;
   address_proof_type: string | null;
   additional_certificates: string[] | null;
   rejection_reason: string | null;
   submitted_at: string | null;
 }
 
 const idProofTypes = [
   { value: "aadhaar", label: "Aadhaar Card" },
   { value: "pan", label: "PAN Card" },
   { value: "passport", label: "Passport" },
   { value: "driving_license", label: "Driving License" },
   { value: "voter_id", label: "Voter ID" },
 ];
 
 const addressProofTypes = [
   { value: "aadhaar", label: "Aadhaar Card" },
   { value: "utility_bill", label: "Utility Bill (Electricity/Water)" },
   { value: "bank_statement", label: "Bank Statement" },
   { value: "rent_agreement", label: "Rent Agreement" },
   { value: "passport", label: "Passport" },
 ];
 
 const KYCVerification = () => {
   const navigate = useNavigate();
   const { toast } = useToast();
   
   const [isLoading, setIsLoading] = useState(true);
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [kycData, setKycData] = useState<KYCData | null>(null);
   const [userId, setUserId] = useState<string | null>(null);
   
   // Form state
   const [idProofFile, setIdProofFile] = useState<File | null>(null);
   const [idProofType, setIdProofType] = useState("");
   const [addressProofFile, setAddressProofFile] = useState<File | null>(null);
   const [addressProofType, setAddressProofType] = useState("");
   const [certificates, setCertificates] = useState<File[]>([]);
 
   useEffect(() => {
     checkAuthAndFetchKYC();
   }, []);
 
   const checkAuthAndFetchKYC = async () => {
     const { data: { session } } = await supabase.auth.getSession();
     
     if (!session) {
       navigate("/auth");
       return;
     }
     
     setUserId(session.user.id);
     
     // Fetch existing KYC data
     const { data, error } = await supabase
       .from('kyc_verifications')
       .select('*')
       .eq('user_id', session.user.id)
       .single();
     
     if (data) {
       setKycData(data as KYCData);
     }
     
     setIsLoading(false);
   };
 
   const handleFileChange = (
     e: React.ChangeEvent<HTMLInputElement>, 
     setter: React.Dispatch<React.SetStateAction<File | null>>
   ) => {
     const file = e.target.files?.[0];
     if (file) {
       if (file.size > 5 * 1024 * 1024) {
         toast({ title: "Error", description: "File size must be less than 5MB", variant: "destructive" });
         return;
       }
       setter(file);
     }
   };
 
   const handleCertificatesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     const files = Array.from(e.target.files || []);
     const validFiles = files.filter(file => {
       if (file.size > 5 * 1024 * 1024) {
         toast({ title: "Error", description: `${file.name} is too large (max 5MB)`, variant: "destructive" });
         return false;
       }
       return true;
     });
     setCertificates(prev => [...prev, ...validFiles].slice(0, 5));
   };
 
   const removeCertificate = (index: number) => {
     setCertificates(prev => prev.filter((_, i) => i !== index));
   };
 
   const uploadFile = async (file: File, folder: string): Promise<string | null> => {
     if (!userId) return null;
     
     const fileExt = file.name.split('.').pop();
     const fileName = `${userId}/${folder}/${Date.now()}.${fileExt}`;
     
     const { error } = await supabase.storage
       .from('kyc-documents')
       .upload(fileName, file);
     
     if (error) {
       console.error('Upload error:', error);
       return null;
     }
     
     return fileName;
   };
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     
     if (!idProofFile || !idProofType) {
       toast({ title: "Error", description: "Please upload ID proof and select its type", variant: "destructive" });
       return;
     }
     
     if (!addressProofFile || !addressProofType) {
       toast({ title: "Error", description: "Please upload address proof and select its type", variant: "destructive" });
       return;
     }
     
     if (!userId) {
       toast({ title: "Error", description: "Please login to continue", variant: "destructive" });
       return;
     }
     
     setIsSubmitting(true);
     
     try {
       // Upload ID proof
       const idProofUrl = await uploadFile(idProofFile, 'id-proof');
       if (!idProofUrl) {
         throw new Error('Failed to upload ID proof');
       }
       
       // Upload address proof
       const addressProofUrl = await uploadFile(addressProofFile, 'address-proof');
       if (!addressProofUrl) {
         throw new Error('Failed to upload address proof');
       }
       
       // Upload certificates
       const certificateUrls: string[] = [];
       for (const cert of certificates) {
         const url = await uploadFile(cert, 'certificates');
         if (url) certificateUrls.push(url);
       }
       
       // Insert or update KYC record
       const kycPayload = {
         user_id: userId,
         id_proof_url: idProofUrl,
         id_proof_type: idProofType,
         address_proof_url: addressProofUrl,
         address_proof_type: addressProofType,
         additional_certificates: certificateUrls.length > 0 ? certificateUrls : null,
         status: 'pending' as const,
         submitted_at: new Date().toISOString(),
       };
       
       if (kycData) {
         // Update existing
         const { error } = await supabase
           .from('kyc_verifications')
           .update(kycPayload)
           .eq('user_id', userId);
         
         if (error) throw error;
       } else {
         // Insert new
         const { error } = await supabase
           .from('kyc_verifications')
           .insert(kycPayload);
         
         if (error) throw error;
       }
       
       // Update profile kyc_status
      await supabase
        .from('users')
        .update({ kyc_status: 'pending' })
        .eq('user_id', userId);
       
       toast({ 
         title: "KYC Submitted!", 
         description: "Your documents have been submitted for verification. We'll notify you once reviewed.",
       });
       
       // Refresh KYC data
       checkAuthAndFetchKYC();
       
     } catch (error: any) {
       toast({ title: "Error", description: error.message || "Failed to submit KYC", variant: "destructive" });
     } finally {
       setIsSubmitting(false);
     }
   };
 
   const getStatusBadge = (status: KYCStatus) => {
     switch (status) {
       case 'approved':
         return (
           <Badge className="bg-emerald-100 text-emerald-700 gap-1.5">
             <CheckCircle2 className="h-3.5 w-3.5" />
             Approved
           </Badge>
         );
       case 'rejected':
         return (
           <Badge className="bg-red-100 text-red-700 gap-1.5">
             <XCircle className="h-3.5 w-3.5" />
             Rejected
           </Badge>
         );
       case 'under_review':
         return (
           <Badge className="bg-blue-100 text-blue-700 gap-1.5">
             <Eye className="h-3.5 w-3.5" />
             Under Review
           </Badge>
         );
       default:
         return (
           <Badge className="bg-amber-100 text-amber-700 gap-1.5">
             <Clock className="h-3.5 w-3.5" />
             Pending
           </Badge>
         );
     }
   };
 
   if (isLoading) {
     return (
       <div className="flex min-h-screen items-center justify-center bg-background">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
       </div>
     );
   }
 
   // Show status if already submitted
   if (kycData && kycData.submitted_at) {
     return (
       <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-12">
         <div className="absolute inset-0 honeycomb-pattern opacity-30" />
         <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-accent/20" />
         
         <div className="relative z-10 w-full max-w-md">
           {/* Logo */}
           <div className="mb-8 flex flex-col items-center">
             <Link to="/" className="mb-6 flex items-center gap-3">
               <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-honey">
                 <Hexagon className="h-8 w-8 text-primary-foreground" fill="currentColor" />
               </div>
             </Link>
             <h1 className="text-3xl font-bold text-foreground">
               Handy<span className="text-primary">Hive</span>
             </h1>
           </div>
 
           <Card className="border-border/50 shadow-soft">
             <CardHeader className="text-center">
               <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent">
                 <Shield className="h-8 w-8 text-primary" />
               </div>
               <CardTitle>KYC Verification Status</CardTitle>
               <CardDescription>Your verification documents have been submitted</CardDescription>
             </CardHeader>
             <CardContent className="space-y-6">
               {/* Status */}
               <div className="flex items-center justify-center">
                 {getStatusBadge(kycData.status)}
               </div>
 
               {/* Status Message */}
               {kycData.status === 'approved' && (
                 <div className="rounded-lg bg-emerald-50 p-4 text-center">
                   <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-600" />
                   <p className="font-medium text-emerald-800">Congratulations!</p>
                   <p className="mt-1 text-sm text-emerald-700">
                     Your KYC is approved. You can now accept service requests.
                   </p>
                 </div>
               )}
 
               {kycData.status === 'pending' && (
                 <div className="rounded-lg bg-amber-50 p-4 text-center">
                   <Clock className="mx-auto mb-2 h-8 w-8 text-amber-600" />
                   <p className="font-medium text-amber-800">Verification Pending</p>
                   <p className="mt-1 text-sm text-amber-700">
                     Your documents are being reviewed. This usually takes 24-48 hours.
                   </p>
                 </div>
               )}
 
               {kycData.status === 'under_review' && (
                 <div className="rounded-lg bg-blue-50 p-4 text-center">
                   <Eye className="mx-auto mb-2 h-8 w-8 text-blue-600" />
                   <p className="font-medium text-blue-800">Under Review</p>
                   <p className="mt-1 text-sm text-blue-700">
                     Our team is currently reviewing your documents.
                   </p>
                 </div>
               )}
 
               {kycData.status === 'rejected' && (
                 <div className="rounded-lg bg-red-50 p-4 text-center">
                   <XCircle className="mx-auto mb-2 h-8 w-8 text-red-600" />
                   <p className="font-medium text-red-800">Verification Rejected</p>
                   <p className="mt-1 text-sm text-red-700">
                     {kycData.rejection_reason || "Please re-upload valid documents."}
                   </p>
                   <Button 
                     className="mt-4" 
                     onClick={() => setKycData(null)}
                   >
                     Re-submit Documents
                   </Button>
                 </div>
               )}
 
               {/* Documents Submitted */}
               <div className="space-y-3">
                 <h4 className="text-sm font-medium text-foreground">Documents Submitted</h4>
                 <div className="space-y-2">
                   <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
                     <CreditCard className="h-5 w-5 text-muted-foreground" />
                     <div className="flex-1">
                       <p className="text-sm font-medium text-foreground">ID Proof</p>
                       <p className="text-xs text-muted-foreground">
                         {idProofTypes.find(t => t.value === kycData.id_proof_type)?.label || kycData.id_proof_type}
                       </p>
                     </div>
                     <CheckCircle2 className="h-5 w-5 text-success" />
                   </div>
                   <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
                     <MapPin className="h-5 w-5 text-muted-foreground" />
                     <div className="flex-1">
                       <p className="text-sm font-medium text-foreground">Address Proof</p>
                       <p className="text-xs text-muted-foreground">
                         {addressProofTypes.find(t => t.value === kycData.address_proof_type)?.label || kycData.address_proof_type}
                       </p>
                     </div>
                     <CheckCircle2 className="h-5 w-5 text-success" />
                   </div>
                   {kycData.additional_certificates && kycData.additional_certificates.length > 0 && (
                     <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
                       <Award className="h-5 w-5 text-muted-foreground" />
                       <div className="flex-1">
                         <p className="text-sm font-medium text-foreground">Certificates</p>
                         <p className="text-xs text-muted-foreground">
                           {kycData.additional_certificates.length} file(s) uploaded
                         </p>
                       </div>
                       <CheckCircle2 className="h-5 w-5 text-success" />
                     </div>
                   )}
                 </div>
               </div>
 
               {/* Warning for non-approved */}
               {kycData.status !== 'approved' && (
                 <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                   <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                   <p className="text-sm text-amber-700">
                     You cannot accept service requests until your KYC is approved.
                   </p>
                 </div>
               )}
 
               <Button className="w-full" asChild>
                 <Link to="/provider">Go to Dashboard</Link>
               </Button>
             </CardContent>
           </Card>
         </div>
       </div>
     );
   }
 
   // Show upload form
   return (
     <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-8">
       <div className="absolute inset-0 honeycomb-pattern opacity-30" />
       <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-accent/20" />
       
       <div className="relative z-10 w-full max-w-lg">
         {/* Logo */}
         <div className="mb-6 flex flex-col items-center">
           <Link to="/" className="mb-4 flex items-center gap-3">
             <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-honey">
               <Hexagon className="h-7 w-7 text-primary-foreground" fill="currentColor" />
             </div>
           </Link>
           <h1 className="text-2xl font-bold text-foreground">
             Handy<span className="text-primary">Hive</span>
           </h1>
           <p className="mt-2 text-center text-muted-foreground">
             Complete KYC Verification
           </p>
         </div>
 
         <Card className="border-border/50 shadow-soft">
           <CardHeader>
             <div className="flex items-center gap-3">
               <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                 <Shield className="h-5 w-5 text-primary" />
               </div>
               <div>
                 <CardTitle className="text-lg">KYC Verification</CardTitle>
                 <CardDescription>Upload your identity documents</CardDescription>
               </div>
             </div>
           </CardHeader>
           <CardContent>
             <form onSubmit={handleSubmit} className="space-y-5">
               {/* ID Proof */}
               <div className="space-y-3">
                 <Label className="flex items-center gap-2">
                   <CreditCard className="h-4 w-4" />
                   ID Proof *
                 </Label>
                 <select
                   value={idProofType}
                   onChange={(e) => setIdProofType(e.target.value)}
                   className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                   required
                   disabled={isSubmitting}
                 >
                   <option value="">Select ID type...</option>
                   {idProofTypes.map(type => (
                     <option key={type.value} value={type.value}>{type.label}</option>
                   ))}
                 </select>
                 <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-border p-4 transition-colors hover:border-primary hover:bg-accent/50">
                   <Upload className="h-5 w-5 text-muted-foreground" />
                   <div className="flex-1">
                     {idProofFile ? (
                       <span className="text-sm font-medium text-foreground">{idProofFile.name}</span>
                     ) : (
                       <span className="text-sm text-muted-foreground">Upload ID document (PDF, JPG, PNG)</span>
                     )}
                   </div>
                   <input
                     type="file"
                     accept=".pdf,.jpg,.jpeg,.png"
                     className="hidden"
                     onChange={(e) => handleFileChange(e, setIdProofFile)}
                     disabled={isSubmitting}
                   />
                 </label>
               </div>
 
               {/* Address Proof */}
               <div className="space-y-3">
                 <Label className="flex items-center gap-2">
                   <MapPin className="h-4 w-4" />
                   Address Proof *
                 </Label>
                 <select
                   value={addressProofType}
                   onChange={(e) => setAddressProofType(e.target.value)}
                   className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                   required
                   disabled={isSubmitting}
                 >
                   <option value="">Select document type...</option>
                   {addressProofTypes.map(type => (
                     <option key={type.value} value={type.value}>{type.label}</option>
                   ))}
                 </select>
                 <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-border p-4 transition-colors hover:border-primary hover:bg-accent/50">
                   <Upload className="h-5 w-5 text-muted-foreground" />
                   <div className="flex-1">
                     {addressProofFile ? (
                       <span className="text-sm font-medium text-foreground">{addressProofFile.name}</span>
                     ) : (
                       <span className="text-sm text-muted-foreground">Upload address proof (PDF, JPG, PNG)</span>
                     )}
                   </div>
                   <input
                     type="file"
                     accept=".pdf,.jpg,.jpeg,.png"
                     className="hidden"
                     onChange={(e) => handleFileChange(e, setAddressProofFile)}
                     disabled={isSubmitting}
                   />
                 </label>
               </div>
 
               {/* Additional Certificates */}
               <div className="space-y-3">
                 <Label className="flex items-center gap-2">
                   <Award className="h-4 w-4" />
                   Additional Certificates <span className="text-muted-foreground">(optional)</span>
                 </Label>
                 <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-border p-4 transition-colors hover:border-primary hover:bg-accent/50">
                   <Upload className="h-5 w-5 text-muted-foreground" />
                   <div className="flex-1">
                     <span className="text-sm text-muted-foreground">
                       Upload skill certificates, training docs (max 5 files)
                     </span>
                   </div>
                   <input
                     type="file"
                     accept=".pdf,.jpg,.jpeg,.png"
                     className="hidden"
                     multiple
                     onChange={handleCertificatesChange}
                     disabled={isSubmitting}
                   />
                 </label>
                 {certificates.length > 0 && (
                   <div className="space-y-2">
                     {certificates.map((cert, index) => (
                       <div key={index} className="flex items-center gap-2 rounded-lg bg-muted p-2">
                         <FileText className="h-4 w-4 text-muted-foreground" />
                         <span className="flex-1 truncate text-sm">{cert.name}</span>
                         <button
                           type="button"
                           onClick={() => removeCertificate(index)}
                           className="rounded p-1 hover:bg-background"
                         >
                           <X className="h-4 w-4 text-muted-foreground" />
                         </button>
                       </div>
                     ))}
                   </div>
                 )}
               </div>
 
               {/* Info Notice */}
               <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/50 p-4">
                 <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                 <div className="text-sm text-muted-foreground">
                   <p className="font-medium text-foreground">Important</p>
                   <ul className="mt-1 list-inside list-disc space-y-1">
                     <li>All documents must be clear and readable</li>
                     <li>Maximum file size: 5MB per file</li>
                     <li>Verification takes 24-48 hours</li>
                   </ul>
                 </div>
               </div>
 
               {/* Submit Button */}
               <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                 {isSubmitting ? (
                   <>
                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                     Uploading documents...
                   </>
                 ) : (
                   <>
                     Submit for Verification
                     <Shield className="ml-2 h-4 w-4" />
                   </>
                 )}
               </Button>
             </form>
           </CardContent>
         </Card>
 
         {/* Back link */}
         <div className="mt-6 text-center">
           <Link 
             to="/provider" 
             className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
           >
             <ArrowLeft className="h-4 w-4" />
             Back to Dashboard
           </Link>
         </div>
       </div>
     </div>
   );
 };
 
 export default KYCVerification;