import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Hexagon, Mail, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const VerifyEmail = () => {
  const [isResending, setIsResending] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkVerificationStatus();
  }, []);

  const checkVerificationStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    setEmail(user.email || null);

    // Check if email is verified
    if (user.email_confirmed_at) {
      setIsVerified(true);
      toast({
        title: "Email Verified!",
        description: "Redirecting to dashboard...",
      });
      setTimeout(() => navigate("/dashboard"), 2000);
    }
  };

  const handleResendEmail = async () => {
    if (!email) return;

    setIsResending(true);

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Email Sent!",
        description: "Check your inbox for the verification link.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to resend email",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-12">
      {/* Background */}
      <div className="absolute inset-0 honeycomb-pattern opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-accent/20" />
      
      {/* Decorative blurs */}
      <div className="absolute -left-32 top-1/4 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -right-32 bottom-1/4 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />

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

        {/* Card */}
        <Card>
          <CardHeader>
            <CardTitle>
              {isVerified ? "Email Verified!" : "Verify Your Email"}
            </CardTitle>
            <CardDescription>
              {isVerified
                ? "Your email has been successfully verified."
                : "We've sent a verification link to your email address."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isVerified ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="rounded-full bg-blue-100 p-3">
                    <Mail className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    We sent a verification email to:
                  </p>
                  <p className="mt-1 font-semibold">{email}</p>
                </div>

                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
                    <div className="text-sm text-amber-800">
                      <p className="font-medium">Important</p>
                      <p className="mt-1">
                        You must verify your email before accessing the platform. 
                        Check your spam folder if you don't see the email.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={handleResendEmail}
                    variant="outline"
                    className="w-full"
                    disabled={isResending}
                  >
                    {isResending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Resend Verification Email
                  </Button>

                  <Button
                    onClick={checkVerificationStatus}
                    className="w-full"
                  >
                    I've Verified My Email
                  </Button>

                  <Button
                    onClick={handleSignOut}
                    variant="ghost"
                    className="w-full"
                  >
                    Sign Out
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-center">
                <div className="flex justify-center">
                  <div className="rounded-full bg-green-100 p-3">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold">Success!</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Your email has been verified. Redirecting to dashboard...
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerifyEmail;
