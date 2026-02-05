 import { useState, useEffect } from "react";
 import { useNavigate } from "react-router-dom";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Badge } from "@/components/ui/badge";
 import { Switch } from "@/components/ui/switch";
 import { Separator } from "@/components/ui/separator";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import {
   Hexagon,
   ArrowLeft,
   Wrench,
   Clock,
   MapPin,
   Plus,
   X,
   Loader2,
   Save,
   Calendar,
 } from "lucide-react";
 import { supabase } from "@/integrations/supabase/client";
 import { useToast } from "@/hooks/use-toast";
 import { z } from "zod";
 
 // Validation schemas
 const skillSchema = z.object({
   skill_name: z.string().trim().min(2, "Skill name must be at least 2 characters").max(50, "Skill name too long"),
   experience_years: z.number().min(0).max(50),
 });
 
 const areaSchema = z.object({
   area_name: z.string().trim().min(2, "Area name must be at least 2 characters").max(100, "Area name too long"),
   pincode: z.string().regex(/^\d{6}$/, "Pincode must be 6 digits").optional().or(z.literal("")),
   radius_km: z.number().min(1).max(50),
 });
 
 interface Schedule {
   day_of_week: number;
   is_working: boolean;
   start_time: string;
   end_time: string;
 }
 
 interface Skill {
   id?: string;
   skill_name: string;
   experience_years: number;
   is_primary: boolean;
 }
 
 interface ServiceArea {
   id?: string;
   area_name: string;
   pincode: string;
   radius_km: number;
 }
 
 const daysOfWeek = [
   { value: 0, label: "Sunday" },
   { value: 1, label: "Monday" },
   { value: 2, label: "Tuesday" },
   { value: 3, label: "Wednesday" },
   { value: 4, label: "Thursday" },
   { value: 5, label: "Friday" },
   { value: 6, label: "Saturday" },
 ];
 
 const timeSlots = [
   "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
   "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00",
 ];
 
 const availableSkills = [
   "Plumbing", "Electrical", "Carpentry", "AC Repair", "Appliance Repair",
   "Painting", "Cleaning", "Pest Control", "Gardening", "Home Renovation",
 ];
 
 const SkillAvailabilitySetup = () => {
   const navigate = useNavigate();
   const { toast } = useToast();
   const [isLoading, setIsLoading] = useState(true);
   const [isSaving, setIsSaving] = useState(false);
 
   // State
   const [schedules, setSchedules] = useState<Schedule[]>(
     daysOfWeek.map((day) => ({
       day_of_week: day.value,
       is_working: day.value >= 1 && day.value <= 5, // Mon-Fri default
       start_time: "09:00",
       end_time: "18:00",
     }))
   );
   const [skills, setSkills] = useState<Skill[]>([]);
   const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>([]);
 
   // New item forms
   const [newSkill, setNewSkill] = useState("");
   const [newExperience, setNewExperience] = useState(1);
   const [newArea, setNewArea] = useState("");
   const [newPincode, setNewPincode] = useState("");
   const [newRadius, setNewRadius] = useState(5);
 
   useEffect(() => {
     fetchData();
   }, []);
 
   const fetchData = async () => {
     try {
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) {
         navigate("/auth");
         return;
       }
 
       // Fetch schedules
       const { data: schedulesData } = await supabase
         .from("provider_schedules")
         .select("*")
         .eq("provider_id", user.id);
 
       if (schedulesData && schedulesData.length > 0) {
         const mergedSchedules = daysOfWeek.map((day) => {
           const existing = schedulesData.find((s) => s.day_of_week === day.value);
           return existing
             ? {
                 day_of_week: existing.day_of_week,
                 is_working: existing.is_working,
                 start_time: existing.start_time.slice(0, 5),
                 end_time: existing.end_time.slice(0, 5),
               }
             : {
                 day_of_week: day.value,
                 is_working: false,
                 start_time: "09:00",
                 end_time: "18:00",
               };
         });
         setSchedules(mergedSchedules);
       }
 
       // Fetch skills
       const { data: skillsData } = await supabase
         .from("provider_skills")
         .select("*")
         .eq("provider_id", user.id);
 
       if (skillsData) {
         setSkills(skillsData);
       }
 
       // Fetch service areas
       const { data: areasData } = await supabase
         .from("provider_service_areas")
         .select("*")
         .eq("provider_id", user.id);
 
       if (areasData) {
         setServiceAreas(areasData);
       }
     } catch (error) {
       console.error("Error fetching data:", error);
     } finally {
       setIsLoading(false);
     }
   };
 
   const handleScheduleChange = (dayIndex: number, field: keyof Schedule, value: any) => {
     setSchedules((prev) =>
       prev.map((s, i) => (i === dayIndex ? { ...s, [field]: value } : s))
     );
   };
 
   const handleAddSkill = () => {
     try {
       const validated = skillSchema.parse({
         skill_name: newSkill,
         experience_years: newExperience,
       });
 
       if (skills.some((s) => s.skill_name.toLowerCase() === validated.skill_name.toLowerCase())) {
         toast({ title: "Skill already added", variant: "destructive" });
         return;
       }
 
       setSkills((prev) => [
         ...prev,
         { skill_name: validated.skill_name, experience_years: validated.experience_years, is_primary: prev.length === 0 },
       ]);
       setNewSkill("");
       setNewExperience(1);
     } catch (error: any) {
       toast({ title: "Invalid skill", description: error.errors?.[0]?.message, variant: "destructive" });
     }
   };
 
   const handleRemoveSkill = (skillName: string) => {
     setSkills((prev) => prev.filter((s) => s.skill_name !== skillName));
   };
 
   const handleSetPrimarySkill = (skillName: string) => {
     setSkills((prev) =>
       prev.map((s) => ({ ...s, is_primary: s.skill_name === skillName }))
     );
   };
 
   const handleAddArea = () => {
     try {
       const validated = areaSchema.parse({
         area_name: newArea,
         pincode: newPincode || undefined,
         radius_km: newRadius,
       });
 
       if (serviceAreas.some((a) => a.area_name.toLowerCase() === validated.area_name.toLowerCase())) {
         toast({ title: "Area already added", variant: "destructive" });
         return;
       }
 
       setServiceAreas((prev) => [
         ...prev,
         { area_name: validated.area_name, pincode: newPincode, radius_km: validated.radius_km },
       ]);
       setNewArea("");
       setNewPincode("");
       setNewRadius(5);
     } catch (error: any) {
       toast({ title: "Invalid area", description: error.errors?.[0]?.message, variant: "destructive" });
     }
   };
 
   const handleRemoveArea = (areaName: string) => {
     setServiceAreas((prev) => prev.filter((a) => a.area_name !== areaName));
   };
 
   const handleSave = async () => {
     setIsSaving(true);
 
     try {
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) {
         navigate("/auth");
         return;
       }
 
       // Delete and re-insert schedules
       await supabase.from("provider_schedules").delete().eq("provider_id", user.id);
       const schedulesToInsert = schedules.map((s) => ({
         provider_id: user.id,
         day_of_week: s.day_of_week,
         is_working: s.is_working,
         start_time: s.start_time,
         end_time: s.end_time,
       }));
       const { error: schedError } = await supabase.from("provider_schedules").insert(schedulesToInsert);
       if (schedError) throw schedError;
 
       // Delete and re-insert skills
       await supabase.from("provider_skills").delete().eq("provider_id", user.id);
       if (skills.length > 0) {
         const skillsToInsert = skills.map((s) => ({
           provider_id: user.id,
           skill_name: s.skill_name,
           experience_years: s.experience_years,
           is_primary: s.is_primary,
         }));
         const { error: skillError } = await supabase.from("provider_skills").insert(skillsToInsert);
         if (skillError) throw skillError;
       }
 
       // Delete and re-insert service areas
       await supabase.from("provider_service_areas").delete().eq("provider_id", user.id);
       if (serviceAreas.length > 0) {
         const areasToInsert = serviceAreas.map((a) => ({
           provider_id: user.id,
           area_name: a.area_name,
           pincode: a.pincode || null,
           radius_km: a.radius_km,
         }));
         const { error: areaError } = await supabase.from("provider_service_areas").insert(areasToInsert);
         if (areaError) throw areaError;
       }
 
       // Update primary skill in profile
       const primarySkill = skills.find((s) => s.is_primary);
       if (primarySkill) {
        await supabase
          .from("users")
          .update({ primary_skill: primarySkill.skill_name })
          .eq("user_id", user.id);
       }
 
       toast({ title: "Settings saved!", description: "Your availability has been updated" });
     } catch (error: any) {
       console.error("Save error:", error);
       toast({ title: "Error saving", description: error.message, variant: "destructive" });
     } finally {
       setIsSaving(false);
     }
   };
 
   if (isLoading) {
     return (
       <div className="flex min-h-screen items-center justify-center bg-background">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
       </div>
     );
   }
 
   return (
     <div className="min-h-screen bg-background">
       {/* Header */}
       <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
         <div className="container mx-auto flex h-16 items-center justify-between px-4">
           <div className="flex items-center gap-4">
             <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
               <ArrowLeft className="h-5 w-5" />
             </Button>
             <div className="flex items-center gap-2">
               <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                 <Hexagon className="h-5 w-5 text-primary-foreground" fill="currentColor" />
               </div>
               <span className="text-xl font-bold text-foreground">
                 Handy<span className="text-primary">Hive</span>
               </span>
             </div>
           </div>
           <Button onClick={handleSave} disabled={isSaving}>
             {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
             Save Changes
           </Button>
         </div>
       </header>
 
       <main className="container mx-auto max-w-4xl px-4 py-6">
         <div className="mb-6">
           <h1 className="text-2xl font-bold text-foreground">Skill & Availability Setup</h1>
           <p className="text-muted-foreground">Configure your skills, working hours, and service areas</p>
         </div>
 
         <div className="space-y-6">
           {/* Skills Section */}
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <Wrench className="h-5 w-5 text-primary" />
                 Skills & Expertise
               </CardTitle>
               <CardDescription>Add the services you can provide</CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
               {/* Current Skills */}
               {skills.length > 0 && (
                 <div className="flex flex-wrap gap-2 mb-4">
                   {skills.map((skill) => (
                     <Badge
                       key={skill.skill_name}
                       variant={skill.is_primary ? "default" : "secondary"}
                       className="flex items-center gap-2 py-1.5 px-3"
                     >
                       <span>{skill.skill_name}</span>
                       <span className="text-xs opacity-70">({skill.experience_years}yr)</span>
                       {!skill.is_primary && (
                         <button
                           onClick={() => handleSetPrimarySkill(skill.skill_name)}
                           className="text-xs underline opacity-70 hover:opacity-100"
                         >
                           Set Primary
                         </button>
                       )}
                       <button onClick={() => handleRemoveSkill(skill.skill_name)}>
                         <X className="h-3 w-3" />
                       </button>
                     </Badge>
                   ))}
                 </div>
               )}
 
               {/* Add New Skill */}
               <div className="flex flex-wrap gap-3">
                 <div className="flex-1 min-w-[200px]">
                   <Label className="text-xs text-muted-foreground">Skill</Label>
                   <Select value={newSkill} onValueChange={setNewSkill}>
                     <SelectTrigger>
                       <SelectValue placeholder="Select a skill" />
                     </SelectTrigger>
                     <SelectContent>
                       {availableSkills.map((skill) => (
                         <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
                 <div className="w-32">
                   <Label className="text-xs text-muted-foreground">Experience (yrs)</Label>
                   <Input
                     type="number"
                     min={0}
                     max={50}
                     value={newExperience}
                     onChange={(e) => setNewExperience(parseInt(e.target.value) || 0)}
                   />
                 </div>
                 <div className="flex items-end">
                   <Button onClick={handleAddSkill} disabled={!newSkill}>
                     <Plus className="mr-2 h-4 w-4" /> Add
                   </Button>
                 </div>
               </div>
             </CardContent>
           </Card>
 
           {/* Working Hours Section */}
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <Calendar className="h-5 w-5 text-primary" />
                 Working Days & Hours
               </CardTitle>
               <CardDescription>Set your availability for each day</CardDescription>
             </CardHeader>
             <CardContent>
               <div className="space-y-3">
                 {schedules.map((schedule, index) => (
                   <div
                     key={schedule.day_of_week}
                     className="flex flex-wrap items-center gap-4 rounded-lg border border-border p-3"
                   >
                     <div className="flex items-center gap-3 min-w-[140px]">
                       <Switch
                         checked={schedule.is_working}
                         onCheckedChange={(checked) => handleScheduleChange(index, "is_working", checked)}
                       />
                       <span className={schedule.is_working ? "font-medium" : "text-muted-foreground"}>
                         {daysOfWeek[index].label}
                       </span>
                     </div>
 
                     {schedule.is_working && (
                       <div className="flex items-center gap-2">
                         <Clock className="h-4 w-4 text-muted-foreground" />
                         <Select
                           value={schedule.start_time}
                           onValueChange={(v) => handleScheduleChange(index, "start_time", v)}
                         >
                           <SelectTrigger className="w-24">
                             <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                             {timeSlots.map((t) => (
                               <SelectItem key={t} value={t}>{t}</SelectItem>
                             ))}
                           </SelectContent>
                         </Select>
                         <span className="text-muted-foreground">to</span>
                         <Select
                           value={schedule.end_time}
                           onValueChange={(v) => handleScheduleChange(index, "end_time", v)}
                         >
                           <SelectTrigger className="w-24">
                             <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                             {timeSlots.map((t) => (
                               <SelectItem key={t} value={t}>{t}</SelectItem>
                             ))}
                           </SelectContent>
                         </Select>
                       </div>
                     )}
 
                     {!schedule.is_working && (
                       <Badge variant="secondary">Day Off</Badge>
                     )}
                   </div>
                 ))}
               </div>
             </CardContent>
           </Card>
 
           {/* Service Areas Section */}
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <MapPin className="h-5 w-5 text-primary" />
                 Service Areas
               </CardTitle>
               <CardDescription>Define where you provide services</CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
               {/* Current Areas */}
               {serviceAreas.length > 0 && (
                 <div className="space-y-2 mb-4">
                   {serviceAreas.map((area) => (
                     <div
                       key={area.area_name}
                       className="flex items-center justify-between rounded-lg border border-border p-3"
                     >
                       <div>
                         <p className="font-medium">{area.area_name}</p>
                         <p className="text-sm text-muted-foreground">
                           {area.pincode && `Pincode: ${area.pincode} • `}
                           Radius: {area.radius_km} km
                         </p>
                       </div>
                       <Button
                         variant="ghost"
                         size="icon"
                         onClick={() => handleRemoveArea(area.area_name)}
                       >
                         <X className="h-4 w-4" />
                       </Button>
                     </div>
                   ))}
                 </div>
               )}
 
               {/* Add New Area */}
               <Separator />
               <div className="grid gap-4 sm:grid-cols-4">
                 <div className="sm:col-span-2">
                   <Label className="text-xs text-muted-foreground">Area Name</Label>
                   <Input
                     placeholder="e.g., Koramangala"
                     value={newArea}
                     onChange={(e) => setNewArea(e.target.value)}
                     maxLength={100}
                   />
                 </div>
                 <div>
                   <Label className="text-xs text-muted-foreground">Pincode (optional)</Label>
                   <Input
                     placeholder="560034"
                     value={newPincode}
                     onChange={(e) => setNewPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                     maxLength={6}
                   />
                 </div>
                 <div>
                   <Label className="text-xs text-muted-foreground">Radius (km)</Label>
                   <Input
                     type="number"
                     min={1}
                     max={50}
                     value={newRadius}
                     onChange={(e) => setNewRadius(parseInt(e.target.value) || 5)}
                   />
                 </div>
               </div>
               <Button onClick={handleAddArea} disabled={!newArea.trim()} variant="outline">
                 <Plus className="mr-2 h-4 w-4" /> Add Service Area
               </Button>
             </CardContent>
           </Card>
         </div>
       </main>
     </div>
   );
 };
 
 export default SkillAvailabilitySetup;