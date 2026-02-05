import { Loader2 } from "lucide-react";
import { useRedirectIfAuthenticated } from "@/hooks/useAuth";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/home/Hero";
import Services from "@/components/home/Services";
import HowItWorks from "@/components/home/HowItWorks";
import Testimonials from "@/components/home/Testimonials";
import CTASection from "@/components/home/CTASection";

const Index = () => {
  const { isChecking } = useRedirectIfAuthenticated("/dashboard");

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
     <div className="min-h-screen">
       <Navbar />
       <main>
         <Hero />
         <Services />
         <HowItWorks />
         <Testimonials />
         <CTASection />
       </main>
       <Footer />
     </div>
   );
 };
 
 export default Index;
