import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Hexagon, Shield, CheckCircle } from "lucide-react";

const Safety = () => {
  return (
    <div className="min-h-screen bg-background">
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

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-10 w-10 text-primary" />
          <h1 className="text-4xl font-bold">Safety & Security</h1>
        </div>
        
        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Our Commitment to Safety</h2>
            <p className="text-muted-foreground">
              At HandyHive, your safety is our top priority. We've implemented multiple layers of security to ensure a safe experience for both customers and service providers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Provider Verification</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold">Identity Verification</h3>
                  <p className="text-sm text-muted-foreground">All providers must verify their identity with government-issued ID</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold">Background Checks</h3>
                  <p className="text-sm text-muted-foreground">Comprehensive background verification for all service providers</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold">Skill Verification</h3>
                  <p className="text-sm text-muted-foreground">Providers must demonstrate their skills and experience</p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Payment Security</h2>
            <p className="text-muted-foreground">
              All payments are processed through secure, PCI-compliant payment gateways. We never store your complete card details.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Safety Tips</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Always book through the HandyHive platform</li>
              <li>Check provider ratings and reviews before booking</li>
              <li>Keep communication within the platform</li>
              <li>Report any suspicious behavior immediately</li>
              <li>Never share personal financial information directly with providers</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Report an Issue</h2>
            <p className="text-muted-foreground mb-4">
              If you experience any safety concerns, please report them immediately to our support team.
            </p>
            <Button asChild>
              <Link to="/contact">Contact Support</Link>
            </Button>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Safety;
