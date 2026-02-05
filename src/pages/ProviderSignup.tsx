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
import {
    Hexagon,
    Mail,
    Lock,
    User,
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

const ProviderSignup = () => {
    const navigate = useNavigate();
    const { toast } = useToast();

    // Account Information
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // Provider Information
    const [primarySkill, setPrimarySkill] = useState("");
    const [serviceLocation, setServiceLocation] = useState("");
    const [serviceDescription, setServiceDescription] = useState("");
    const [certificationFile, setCertificationFile] = useState<File | null>(null);

    const [isLoading, setIsLoading] = useState(false);

    const validateForm = () => {
        // Account Information Validation
        if (!name.trim()) {
            toast({ title: "Error", description: "Please enter your full name", variant: "destructive" });
            return false;
        }
        if (!email.trim()) {
            toast({ title: "Error", description: "Please enter your email", variant: "destructive" });
            return false;
        }
        if (password.length < 8) {
            toast({ title: "Error", description: "Password must be at least 8 characters", variant: "destructive" });
            return false;
        }

        // Provider Information Validation
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
            // Step 1: Create user account
            const redirectUrl = `${window.location.origin}/dashboard`;

            const { data: signupData, error: signupError } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    emailRedirectTo: redirectUrl,
                    data: {
                        full_name: name,
                        role: "provider", // Mark as provider from the start
                    },
                },
            });

            if (signupError) {
                if (signupError.message.includes("already registered")) {
                    toast({
                        title: "Account exists",
                        description: "This email is already registered. Please log in instead.",
                        variant: "destructive",
                    });
                } else {
                    toast({
                        title: "Signup failed",
                        description: signupError.message,
                        variant: "destructive",
                    });
                }
                setIsLoading(false);
                return;
            }

            if (!signupData.user) {
                toast({
                    title: "Error",
                    description: "Failed to create account. Please try again.",
                    variant: "destructive",
                });
                setIsLoading(false);
                return;
            }

            // Step 2: Upload certification if provided
            let certificationUrl = null;
            if (certificationFile) {
                certificationUrl = await uploadCertification(signupData.user.id);
            }

            // Step 3: Update user profile as provider
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
                .eq('user_id', signupData.user.id);

            if (updateError) {
                console.error("Update error:", updateError);
                toast({
                    title: "Warning",
                    description: "Account created but provider profile setup incomplete. Please complete it from your dashboard.",
                    variant: "destructive"
                });
            }

            toast({
                title: "Welcome to HandyHive! 🎉",
                description: "Please check your email to verify your account and complete KYC verification.",
            });

            // Redirect to login
            navigate("/auth?mode=login");
        } catch (err) {
            console.error("Signup error:", err);
            toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-12">
            {/* Background */}
            <div className="absolute inset-0 honeycomb-pattern opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-accent/20" />

            {/* Decorative blurs */}
            <div className="absolute -left-32 top-1/4 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute -right-32 bottom-1/4 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />

            <div className="relative z-10 w-full max-w-3xl">
                {/* Logo & Header */}
                <div className="mb-8 flex flex-col items-center">
                    <Link to="/" className="mb-6 flex items-center gap-3">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-honey">
                            <Hexagon className="h-8 w-8 text-primary-foreground" fill="currentColor" />
                        </div>
                    </Link>
                    <h1 className="text-3xl font-bold text-foreground">
                        Handy<span className="text-primary">Hive</span>
                    </h1>
                    <p className="mt-2 text-center text-muted-foreground">
                        Join as a Service Provider - Register and start growing your business
                    </p>
                </div>

                {/* Registration Form Card */}
                <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-soft sm:p-8">
                    <form onSubmit={handleSubmit} className="space-y-8">

                        {/* Form Group 1: Account Information */}
                        <div className="space-y-5">
                            <div className="flex items-center gap-2 border-b border-border pb-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                                    <User className="h-4 w-4 text-primary" />
                                </div>
                                <h3 className="text-lg font-semibold text-foreground">Account Information</h3>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name *</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="name"
                                        type="text"
                                        placeholder="John Doe"
                                        className="pl-10"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email *</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="you@example.com"
                                        className="pl-10"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password *</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="Create a strong password"
                                        className="pl-10"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Must be at least 8 characters
                                </p>
                            </div>
                        </div>

                        {/* Form Group 2: Service Provider Details */}
                        <div className="space-y-5">
                            <div className="flex items-center gap-2 border-b border-border pb-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                                    <Briefcase className="h-4 w-4 text-primary" />
                                </div>
                                <h3 className="text-lg font-semibold text-foreground">Service Provider Details</h3>
                            </div>

                            {/* Benefits */}
                            <div className="grid gap-3 sm:grid-cols-3 rounded-lg bg-primary/5 p-4">
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
                                        ID and address verification is mandatory. You'll complete this after email verification.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating Your Account...
                                </>
                            ) : (
                                <>
                                    Register as Service Provider
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>

                        {/* Terms */}
                        <p className="text-center text-xs text-muted-foreground">
                            By signing up, you agree to our{" "}
                            <Link to="/terms" className="underline hover:text-primary">Terms</Link>
                            {" "}and{" "}
                            <Link to="/privacy" className="underline hover:text-primary">Privacy Policy</Link>
                        </p>

                        {/* Login Link */}
                        <div className="pt-2 text-center">
                            <p className="text-sm text-muted-foreground">
                                Already have an account?{" "}
                                <Link
                                    to="/auth?mode=login"
                                    className="font-semibold text-primary hover:underline"
                                >
                                    Login
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>

                {/* Back to Home */}
                <div className="mt-6 text-center">
                    <Link
                        to="/"
                        className="text-sm text-muted-foreground hover:text-primary"
                    >
                        ← Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ProviderSignup;
