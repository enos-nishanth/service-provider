 import { Card, CardContent } from "@/components/ui/card";
 import { Star, Quote } from "lucide-react";
 
 const testimonials = [
   {
     name: "Priya Sharma",
     role: "Homeowner",
     content: "Found an amazing electrician within minutes. Professional, punctual, and did excellent work. Will definitely use HandyHive again!",
     rating: 5,
     avatar: "PS",
   },
   {
     name: "Rahul Verma",
     role: "Business Owner",
     content: "As a service provider, HandyHive has helped me grow my business significantly. The platform is easy to use and the support team is great.",
     rating: 5,
     avatar: "RV",
   },
   {
     name: "Anita Patel",
     role: "Homeowner",
     content: "The plumber arrived on time and fixed our leak quickly. Fair pricing and great communication throughout. Highly recommend!",
     rating: 5,
     avatar: "AP",
   },
 ];
 
 const Testimonials = () => {
   return (
     <section className="py-20">
       <div className="container mx-auto px-4">
         <div className="mb-12 text-center">
           <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
             What Our Users Say
           </h2>
           <p className="mx-auto max-w-2xl text-muted-foreground">
             Join thousands of satisfied customers who have found reliable 
             service providers through HandyHive.
           </p>
         </div>
 
         <div className="grid gap-6 md:grid-cols-3">
           {testimonials.map((testimonial) => (
             <Card key={testimonial.name} className="border-border/50 bg-card">
               <CardContent className="p-6">
                 <Quote className="mb-4 h-8 w-8 text-primary/30" />
                 <p className="mb-6 text-muted-foreground">{testimonial.content}</p>
                 <div className="flex items-center gap-4">
                   <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                     {testimonial.avatar}
                   </div>
                   <div>
                     <p className="font-semibold text-foreground">{testimonial.name}</p>
                     <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                   </div>
                   <div className="ml-auto flex gap-0.5">
                     {[...Array(testimonial.rating)].map((_, i) => (
                       <Star key={i} className="h-4 w-4 text-primary" fill="currentColor" />
                     ))}
                   </div>
                 </div>
               </CardContent>
             </Card>
           ))}
         </div>
       </div>
     </section>
   );
 };
 
 export default Testimonials;