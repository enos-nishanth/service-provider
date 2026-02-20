import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Hexagon, Users, Shield, Zap } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Hexagon className="h-6 w-6 text-primary-foreground" fill="currentColor" />
              </div>
              <span className="text-xl font-bold">
                Handy<span className="text-primary">Hive</span>
              </span>
            </Link>
            <Button variant="ghost" asChild>
              <Link to="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">About HandyHive</h1>
        
        <div className="space-y-8">
          <section>
            <p className="text-lg text-muted-foreground">
              HandyHive is a trusted hyperlocal services marketplace connecting customers with verified service providers for all their home and business needs.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
            <p className="text-muted-foreground">
              To bridge the trust and accessibility gap between skilled workers and customers by providing a secure, reliable platform for local services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Why Choose HandyHive?</h2>
            <div className="grid md:grid-cols-3 gap-6 mt-6">
              <div className="p-6 border border-border rounded-lg">
                <Shield className="h-10 w-10 text-primary mb-4" />
                <h3 className="font-semibold mb-2">Verified Providers</h3>
                <p className="text-sm text-muted-foreground">
                  All service providers undergo KYC verification for your safety
                </p>
              </div>
              <div className="p-6 border border-border rounded-lg">
                <Zap className="h-10 w-10 text-primary mb-4" />
                <h3 className="font-semibold mb-2">Quick Booking</h3>
                <p className="text-sm text-muted-foreground">
                  Book services instantly or schedule for later
                </p>
              </div>
              <div className="p-6 border border-border rounded-lg">
                <Users className="h-10 w-10 text-primary mb-4" />
                <h3 className="font-semibold mb-2">Trusted Community</h3>
                <p className="text-sm text-muted-foreground">
                  Ratings and reviews from real customers
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Our Services</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Plumbing</li>
              <li>Electrical Work</li>
              <li>Carpentry</li>
              <li>AC Repair & Maintenance</li>
              <li>Painting</li>
              <li>Cleaning Services</li>
              <li>Appliance Repair</li>
              <li>Pest Control</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};

export default About;
