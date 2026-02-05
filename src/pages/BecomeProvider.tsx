import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useRequireAuth } from "@/hooks/useAuth";
import {
  Briefcase,
  MapPin,
  FileText,
  Upload,
  Shield,
  ArrowRight,
  Loader2,
  CheckCircle2,
} from "lucide-react";

const skillOptions = [
  { value: "plumber", label: "Plumber" },
  { value: "electrician", label: "Electrician" },
  { value: "carpenter", label: "Carpenter" },
  { value: "ac_technician", label: "AC Technician" },
  { value: "painter", label: "Painter" },
  { value: "cleaner", label: "Cleaning Professional" },
  { value: "appliance_repair", label: "Appliance Repair" },
  { value: "pest_control", label: "Pest Control" },
  { value: "other", label: "Other" },
];

const BecomeProvider = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isChecking, isAuthenticated } = useRequireAuth();

  const [primarySkill, setPrimarySkill] = useState("");
  const [serviceLocation, setServiceLocation] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [certificationFile, setCertificationFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    if (!primarySkill) {
      toast({ title: "Error", description: "Please select your primary skill", variant: "destructive" });
      return false;
    }
    if (!serviceLocation.trim()) {
      toast({ title: "Error", description: "Please enter your service location", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Error", description: "File size must be less than 5MB", variant: "destructive" });
        return;
      }
      setCertificationFile(file);
    }
  };

  const uploadCertification = async (userId: string): Promise<string | null> => {
    if (!certificationFile) return null;

    const fileExt = certificationFile.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from('certifications')
      .upload(fileName, certificationFile);

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    return fileName;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Upload certification if provided
      let certificationUrl = null;
      if (certificationFile) {
        certificationUrl = await uploadCertification(user.id);
      }

      // Update profile to become a provider
      const { error: updateError } = await supabase
        .from('users')
        .update({
          is_provider: true,
          primary_skill: primarySkill,
          service_location: serviceLocation,
          service_description: serviceDescription || null,
          certification_url: certificationUrl,
          kyc_status: 'pending',
        })
        .eq('user_id', user.id);

      if (updateError) {
        toast({ 
          title: "Error", 
          description: "Could not update your profile. Please try again.", 
          variant: "destructive" 
        });
        return;
      }

      toast({ 
        title: "Welcome to the provider community! 🎉",
        description: "Complete your KYC verification to start accepting jobs.",
      });
      
      navigate("/provider/kyc");
    } catch (err) {
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Briefcase className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Become a Service Provider</h1>
              <p className="text-muted-foreground">Start earning by offering your skills on HandyHive</p>
            </div>
          </div>
          
          {/* Benefits */}
          <div className="grid gap-3 sm:grid-cols-3 mt-6">
            {[
              "Set your own rates",
              "Flexible schedule",
              "Secure payments",
            ].map((benefit) => (
              <div key={benefit} className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-success" />
                {benefit}
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Primary Skill */}
            <div className="space-y-2">
              <Label htmlFor="primarySkill">Primary Skill *</Label>
              <Select value={primarySkill} onValueChange={setPrimarySkill} disabled={isLoading}>
                <SelectTrigger className="w-full">
                  <Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Select your primary skill" />
                </SelectTrigger>
                <SelectContent>
                  {skillOptions.map((skill) => (
                    <SelectItem key={skill.value} value={skill.value}>
                      {skill.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Service Location */}
            <div className="space-y-2">
              <Label htmlFor="serviceLocation">Service Location *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  id="serviceLocation" 
                  type="text" 
                  placeholder="e.g., Koramangala, Bangalore" 
                  className="pl-10"
                  value={serviceLocation}
                  onChange={(e) => setServiceLocation(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Service Description */}
            <div className="space-y-2">
              <Label htmlFor="serviceDescription">
                About Your Service <span className="text-muted-foreground">(optional)</span>
              </Label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Textarea 
                  id="serviceDescription" 
                  placeholder="Briefly describe your services, experience, specializations..." 
                  className="min-h-[80px] pl-10 resize-none"
                  value={serviceDescription}
                  onChange={(e) => setServiceDescription(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Certification Upload */}
            <div className="space-y-2">
              <Label htmlFor="certification">
                Certification <span className="text-muted-foreground">(optional)</span>
              </Label>
              <div className="relative">
                <label
                  htmlFor="certification"
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-border p-4 transition-colors hover:border-primary hover:bg-accent/50"
                >
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    {certificationFile ? (
                      <span className="text-sm font-medium text-foreground">{certificationFile.name}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Upload certification document (PDF, JPG, PNG - Max 5MB)
                      </span>
                    )}
                  </div>
                </label>
                <input
                  id="certification"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* KYC Notice */}
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <Shield className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-amber-800">KYC Verification Required</p>
                <p className="mt-1 text-xs text-amber-700">
                  ID and address verification is mandatory. You'll complete this in the next step.
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Continue to KYC Verification
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BecomeProvider;
