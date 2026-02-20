import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Hexagon, HelpCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const Help = () => {
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
          <HelpCircle className="h-10 w-10 text-primary" />
          <h1 className="text-4xl font-bold">Help Center</h1>
        </div>
        
        <Accordion type="single" collapsible className="space-y-4">
          <AccordionItem value="item-1">
            <AccordionTrigger>How do I book a service?</AccordionTrigger>
            <AccordionContent>
              Browse available services, select a provider, choose your preferred date and time, and complete the booking with payment.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2">
            <AccordionTrigger>How do I become a service provider?</AccordionTrigger>
            <AccordionContent>
              Click on "Become a Provider" and complete the registration process including KYC verification.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3">
            <AccordionTrigger>What payment methods are accepted?</AccordionTrigger>
            <AccordionContent>
              We accept UPI, credit/debit cards, net banking, and digital wallets through our secure payment gateway.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4">
            <AccordionTrigger>Can I cancel a booking?</AccordionTrigger>
            <AccordionContent>
              Yes, you can cancel bookings according to our cancellation policy. Refunds depend on the cancellation timing.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-5">
            <AccordionTrigger>How are service providers verified?</AccordionTrigger>
            <AccordionContent>
              All providers undergo KYC verification including ID proof, address verification, and background checks.
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="mt-12 p-6 bg-accent/50 rounded-lg">
          <h3 className="font-semibold mb-2">Still need help?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Contact our support team for assistance
          </p>
          <Button asChild>
            <Link to="/contact">Contact Support</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Help;
