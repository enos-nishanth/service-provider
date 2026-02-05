 import { Card, CardContent } from "@/components/ui/card";
 import { 
   Wrench, 
   Zap, 
   Hammer, 
   Wind, 
   Settings,
   LucideIcon
 } from "lucide-react";
 
 interface ServiceCategory {
   id: string;
   label: string;
   icon: LucideIcon;
   color: string;
 }
 
 const categories: ServiceCategory[] = [
   { id: "plumbing", label: "Plumbing", icon: Wrench, color: "bg-blue-500/10 text-blue-600" },
   { id: "electrical", label: "Electrical", icon: Zap, color: "bg-amber-500/10 text-amber-600" },
   { id: "carpentry", label: "Carpentry", icon: Hammer, color: "bg-orange-500/10 text-orange-600" },
   { id: "ac-repair", label: "AC Repair", icon: Wind, color: "bg-cyan-500/10 text-cyan-600" },
   { id: "appliance-repair", label: "Appliance Repair", icon: Settings, color: "bg-purple-500/10 text-purple-600" },
 ];
 
 interface ServiceCategoriesProps {
   selectedCategory: string | null;
   onSelectCategory: (categoryId: string | null) => void;
 }
 
 const ServiceCategories = ({ selectedCategory, onSelectCategory }: ServiceCategoriesProps) => {
   return (
     <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
       {categories.map((category) => {
         const isSelected = selectedCategory === category.id;
         return (
           <Card
             key={category.id}
             className={`cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md ${
               isSelected ? "ring-2 ring-primary border-primary" : "border-border/50"
             }`}
             onClick={() => onSelectCategory(isSelected ? null : category.id)}
           >
             <CardContent className="flex flex-col items-center gap-3 p-4">
               <div className={`rounded-xl p-3 ${category.color}`}>
                 <category.icon className="h-6 w-6" />
               </div>
               <span className="text-center text-sm font-medium text-foreground">
                 {category.label}
               </span>
             </CardContent>
           </Card>
         );
       })}
     </div>
   );
 };
 
 export default ServiceCategories;
 export { categories };