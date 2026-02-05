 import { Search, CalendarCheck, Star, CheckCircle2 } from "lucide-react";
 
 const steps = [
   {
     icon: Search,
     title: "Search Services",
     description: "Browse through our wide range of verified service providers in your area.",
   },
   {
     icon: CalendarCheck,
     title: "Book Instantly",
     description: "Select your preferred time slot and book with just a few clicks.",
   },
   {
     icon: CheckCircle2,
     title: "Get It Done",
     description: "Our professional arrives on time and completes the job to your satisfaction.",
   },
   {
     icon: Star,
     title: "Rate & Review",
     description: "Share your experience to help others find great service providers.",
   },
 ];
 
 const HowItWorks = () => {
   return (
     <section className="bg-muted/50 py-20" id="how-it-works">
       <div className="container mx-auto px-4">
         <div className="mb-12 text-center">
           <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
             How It Works
           </h2>
           <p className="mx-auto max-w-2xl text-muted-foreground">
             Getting help for your home has never been easier. 
             Follow these simple steps to get started.
           </p>
         </div>
 
         <div className="relative">
           {/* Connection Line - Desktop */}
           <div className="absolute left-0 right-0 top-16 hidden h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent lg:block" />
 
           <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
             {steps.map((step, index) => (
               <div key={step.title} className="relative text-center">
                 {/* Step Number */}
                 <div className="relative mx-auto mb-6">
                   <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-card shadow-soft">
                     <step.icon className="h-8 w-8 text-primary" />
                   </div>
                   <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                     {index + 1}
                   </div>
                 </div>
                 <h3 className="mb-2 font-semibold text-foreground">{step.title}</h3>
                 <p className="text-sm text-muted-foreground">{step.description}</p>
               </div>
             ))}
           </div>
         </div>
       </div>
     </section>
   );
 };
 
 export default HowItWorks;