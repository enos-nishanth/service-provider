 import { Link } from "react-router-dom";
 import { Button } from "@/components/ui/button";
 import { Search, Shield, Clock, Star } from "lucide-react";
 
 const Hero = () => {
   return (
     <section className="relative overflow-hidden py-20 lg:py-28">
       {/* Background Pattern */}
       <div className="absolute inset-0 honeycomb-pattern" />
       <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
       
       <div className="container relative mx-auto px-4">
         <div className="mx-auto max-w-4xl text-center">
           {/* Badge */}
           <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">
             <Star className="h-4 w-4 text-primary" fill="currentColor" />
             Trusted by 10,000+ homeowners
           </div>
 
           {/* Heading */}
           <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-foreground md:text-5xl lg:text-6xl">
             Find Trusted Local{" "}
             <span className="text-gradient-honey">Service Experts</span>{" "}
             Near You
           </h1>
 
           {/* Subheading */}
           <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground md:text-xl">
             Connect with verified plumbers, electricians, carpenters, and more. 
             Book instantly, pay securely, and get the job done right.
           </p>
 
           {/* Search Bar */}
           <div className="mx-auto mb-8 max-w-xl">
             <div className="flex flex-col gap-3 sm:flex-row">
               <div className="relative flex-1">
                 <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                 <input
                   type="text"
                   placeholder="What service do you need?"
                   className="h-14 w-full rounded-xl border border-input bg-card pl-12 pr-4 text-foreground shadow-soft placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                 />
               </div>
               <Button size="xl" variant="hero" asChild>
                 <Link to="/services">Find Services</Link>
               </Button>
             </div>
           </div>
 
           {/* Trust Badges */}
           <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
             <div className="flex items-center gap-2">
               <Shield className="h-5 w-5 text-success" />
               <span>Verified Professionals</span>
             </div>
             <div className="flex items-center gap-2">
               <Clock className="h-5 w-5 text-primary" />
               <span>Same Day Service</span>
             </div>
             <div className="flex items-center gap-2">
               <Star className="h-5 w-5 text-primary" fill="currentColor" />
               <span>4.8/5 Average Rating</span>
             </div>
           </div>
         </div>
       </div>
     </section>
   );
 };
 
 export default Hero;