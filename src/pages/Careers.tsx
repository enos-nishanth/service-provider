import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Hexagon, Briefcase } from "lucide-react";

const Careers = () => {
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
          <Briefcase className="h-10 w-10 text-primary" />
          <h1 className="text-4xl font-bold">Careers at HandyHive</h1>
        </div>
        
        <div className="space-y-8">
          <section>
            <p className="text-lg text-muted-foreground">
              Join our mission to connect skilled workers with customers and build the future of local services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Why Work With Us?</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Work on cutting-edge technology</li>
              <li>Make a real impact on people's lives</li>
              <li>Collaborative and innovative work environment</li>
              <li>Competitive compensation and benefits</li>
              <li>Flexible work arrangements</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Open Positions</h2>
            <div className="space-y-4">
              <div className="p-6 border border-border rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Full Stack Developer</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Build and maintain our web and mobile applications
                </p>
                <Button size="sm">Apply Now</Button>
              </div>
              <div className="p-6 border border-border rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Product Manager</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Drive product strategy and roadmap
                </p>
                <Button size="sm">Apply Now</Button>
              </div>
              <div className="p-6 border border-border rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Customer Success Manager</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Ensure customer satisfaction and success
                </p>
                <Button size="sm">Apply Now</Button>
              </div>
            </div>
          </section>

          <section className="p-6 bg-accent/50 rounded-lg">
            <h3 className="font-semibold mb-2">Don't see a position that fits?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              We're always looking for talented individuals. Send us your resume!
            </p>
            <Button asChild>
              <Link to="/contact">Get in Touch</Link>
            </Button>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Careers;
