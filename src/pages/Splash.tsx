import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Hexagon, Shield, MapPin, Star, Loader2 } from "lucide-react";
import { useRedirectIfAuthenticated } from "@/hooks/useAuth";

const Splash = () => {
  const { isChecking } = useRedirectIfAuthenticated("/dashboard");

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6">
      {/* Background Pattern */}
      <div className="absolute inset-0 honeycomb-pattern opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-accent/30" />
      
      {/* Decorative Elements */}
      <div className="absolute -left-20 top-1/4 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -right-20 bottom-1/4 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />

      {/* Content */}
      <div className="relative z-10 flex max-w-md flex-col items-center text-center">
        {/* Logo */}
        <div className="mb-8 animate-float">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-primary shadow-honey">
            <Hexagon className="h-14 w-14 text-primary-foreground" fill="currentColor" />
          </div>
        </div>

        {/* Brand Name */}
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
          Handy<span className="text-primary">Hive</span>
        </h1>

        {/* Tagline */}
        <p className="mb-8 text-lg text-muted-foreground md:text-xl">
          Trusted local experts, just a tap away
        </p>

        {/* Trust Indicators */}
        <div className="mb-10 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 shadow-soft">
            <Shield className="h-4 w-4 text-success" />
            <span>Verified Pros</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 shadow-soft">
            <MapPin className="h-4 w-4 text-primary" />
            <span>Hyperlocal</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 shadow-soft">
            <Star className="h-4 w-4 text-primary" fill="currentColor" />
            <span>4.8 Rated</span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:gap-4">
          <Button 
            variant="hero" 
            size="xl" 
            className="w-full sm:flex-1" 
            asChild
          >
            <Link to="/auth?mode=signup">Get Started</Link>
          </Button>
          <Button 
            variant="outline" 
            size="xl" 
            className="w-full sm:flex-1" 
            asChild
          >
            <Link to="/auth">Login</Link>
          </Button>
        </div>

        {/* Footer Link */}
        <p className="mt-8 text-sm text-muted-foreground">
          <Link to="/" className="underline-offset-4 hover:text-primary hover:underline">
            Explore as guest →
          </Link>
        </p>
      </div>

      {/* Bottom Branding */}
      <p className="absolute bottom-6 text-xs text-muted-foreground/60">
        © {new Date().getFullYear()} HandyHive. Your home, our experts.
      </p>
    </div>
  );
};

export default Splash;
