import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Briefcase } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const CTASection = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setIsAuthenticated(!!session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <section className="relative overflow-hidden bg-foreground py-20">
      <div className="absolute inset-0 honeycomb-pattern opacity-10" />

      <div className="container relative mx-auto px-4">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8">
          {/* For Customers */}
          <div className="rounded-2xl border border-border/10 bg-background/5 p-8 backdrop-blur-sm">
            <h3 className="mb-4 text-2xl font-bold text-background md:text-3xl">
              Need a Service?
            </h3>
            <p className="mb-6 text-background/70">
              Browse our verified professionals, compare prices, and book instantly.
              Get your home projects done with confidence.
            </p>
            <Button variant="hero" size="lg" asChild>
              <Link to={isAuthenticated ? "/dashboard" : "/services"}>
                {isAuthenticated ? "Go to Dashboard" : "Browse Services"} <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>

          {/* For Providers */}
          <div className="rounded-2xl border border-primary/30 bg-primary/10 p-8 backdrop-blur-sm">
            <div className="mb-4 flex items-center gap-2">
              <Briefcase className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium text-primary">For Professionals</span>
            </div>
            <h3 className="mb-4 text-2xl font-bold text-background md:text-3xl">
              Join as a Service Provider
            </h3>
            <p className="mb-6 text-background/70">
              Grow your business by connecting with customers in your area.
              Set your own schedule and rates.
            </p>
            <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground" asChild>
              <Link to={isAuthenticated ? "/become-provider" : "/provider-signup"}>
                {isAuthenticated ? "Become a Provider" : "Register Now"} <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
