 import { Link } from "react-router-dom";
 import { Card, CardContent } from "@/components/ui/card";
 import { 
   Wrench, 
   Zap, 
   Hammer, 
   Wind, 
   Paintbrush, 
   Droplets,
   ArrowRight
 } from "lucide-react";
 
 const services = [
   {
     icon: Wrench,
     title: "Plumbing",
     description: "Leak repairs, pipe installation, bathroom fittings",
     color: "bg-blue-500/10 text-blue-600",
   },
   {
     icon: Zap,
     title: "Electrical",
     description: "Wiring, repairs, installations, safety inspections",
     color: "bg-amber-500/10 text-amber-600",
   },
   {
     icon: Hammer,
     title: "Carpentry",
     description: "Furniture repair, custom woodwork, installations",
     color: "bg-orange-500/10 text-orange-600",
   },
   {
     icon: Wind,
     title: "AC Repair",
     description: "Installation, servicing, gas refilling, repairs",
     color: "bg-cyan-500/10 text-cyan-600",
   },
   {
     icon: Paintbrush,
     title: "Painting",
     description: "Interior, exterior, texture, waterproofing",
     color: "bg-purple-500/10 text-purple-600",
   },
   {
     icon: Droplets,
     title: "Cleaning",
     description: "Deep cleaning, sanitization, move-in/out",
     color: "bg-emerald-500/10 text-emerald-600",
   },
 ];
 
 const Services = () => {
   return (
     <section className="py-20" id="services">
       <div className="container mx-auto px-4">
         <div className="mb-12 text-center">
           <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
             Popular Services
           </h2>
           <p className="mx-auto max-w-2xl text-muted-foreground">
             From quick fixes to major renovations, our verified professionals 
             are ready to help with all your home service needs.
           </p>
         </div>
 
         <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
           {services.map((service) => (
             <Link key={service.title} to={`/services?category=${service.title.toLowerCase()}`}>
               <Card className="group cursor-pointer border-border/50 bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-honey">
                 <CardContent className="p-6">
                   <div className="flex items-start gap-4">
                     <div className={`rounded-xl p-3 ${service.color}`}>
                       <service.icon className="h-6 w-6" />
                     </div>
                     <div className="flex-1">
                       <h3 className="mb-1 font-semibold text-foreground group-hover:text-primary">
                         {service.title}
                       </h3>
                       <p className="text-sm text-muted-foreground">
                         {service.description}
                       </p>
                     </div>
                     <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 transition-all group-hover:translate-x-1 group-hover:text-primary group-hover:opacity-100" />
                   </div>
                 </CardContent>
               </Card>
             </Link>
           ))}
         </div>
       </div>
     </section>
   );
 };
 
 export default Services;