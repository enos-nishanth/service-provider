 import { useState, useEffect } from "react";
 import { useNavigate, Link } from "react-router-dom";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Alert, AlertDescription } from "@/components/ui/alert";
 import {
   Hexagon,
   Shield,
   Mail,
   Lock,
   Loader2,
   AlertCircle,
   ArrowLeft,
 } from "lucide-react";
 import { supabase } from "@/integrations/supabase/client";
 import { useToast } from "@/hooks/use-toast";
 import { z } from "zod";
 
 const loginSchema = z.object({
   email: z.string().email("Please enter a valid email address"),
   password: z.string().min(6, "Password must be at least 6 characters"),
 });
 
 const AdminLogin = () => {
   const navigate = useNavigate();
   const { toast } = useToast();
   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("");
   const [isLoading, setIsLoading] = useState(false);
   const [isCheckingAuth, setIsCheckingAuth] = useState(true);
   const [error, setError] = useState<string | null>(null);
 
   // Check if already authenticated as admin
   useEffect(() => {
     const checkAdminAuth = async () => {
       try {
         const { data: { session } } = await supabase.auth.getSession();
         if (session?.user) {
           // Check if user has admin role
           const { data: roleData } = await supabase
             .from("user_roles")
             .select("role")
             .eq("user_id", session.user.id)
             .eq("role", "admin")
             .single();
 
           if (roleData) {
             navigate("/admin");
             return;
           }
         }
       } catch (error) {
         console.error("Auth check error:", error);
       } finally {
         setIsCheckingAuth(false);
       }
     };
 
     checkAdminAuth();
   }, [navigate]);
 
   const handleLogin = async (e: React.FormEvent) => {
     e.preventDefault();
     setError(null);
 
     // Validate inputs
     const validation = loginSchema.safeParse({ email, password });
     if (!validation.success) {
       setError(validation.error.errors[0].message);
       return;
     }
 
     setIsLoading(true);
 
     try {
       // Sign in
       const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
         email,
         password,
       });
 
       if (authError) {
         if (authError.message.includes("Invalid login credentials")) {
           setError("Invalid email or password. Please try again.");
         } else if (authError.message.includes("Email not confirmed")) {
           setError("Please verify your email address before logging in.");
         } else {
           setError(authError.message);
         }
         return;
       }
 
       if (!authData.user) {
         setError("Authentication failed. Please try again.");
         return;
       }
 
       // Check if user has admin role
       const { data: roleData, error: roleError } = await supabase
         .from("user_roles")
         .select("role")
         .eq("user_id", authData.user.id)
         .eq("role", "admin")
         .single();
 
       if (roleError || !roleData) {
         // Sign out non-admin user
         await supabase.auth.signOut();
         setError("Access denied. You are not authorized to access the admin panel.");
         return;
       }
 
       toast({
         title: "Welcome, Admin!",
         description: "You have successfully logged in.",
       });
 
       navigate("/admin");
     } catch (err: any) {
       setError("An unexpected error occurred. Please try again.");
     } finally {
       setIsLoading(false);
     }
   };
 
   if (isCheckingAuth) {
     return (
       <div className="flex min-h-screen items-center justify-center bg-background">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
       </div>
     );
   }
 
   return (
     <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
       {/* Header */}
       <header className="container mx-auto px-4 py-6">
         <div className="flex items-center justify-between">
           <Link to="/" className="flex items-center gap-2">
             <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
               <Hexagon className="h-6 w-6 text-primary-foreground" fill="currentColor" />
             </div>
             <span className="text-xl font-bold text-foreground">
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
       </header>
 
       {/* Main Content */}
       <main className="container mx-auto flex flex-1 items-center justify-center px-4 py-12">
         <Card className="w-full max-w-md border-primary/20">
           <CardHeader className="space-y-4 text-center">
             <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
               <Shield className="h-8 w-8 text-primary" />
             </div>
             <div>
               <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
               <CardDescription className="mt-2">
                 Access the HandyHive administration panel
               </CardDescription>
             </div>
           </CardHeader>
 
           <CardContent>
             <form onSubmit={handleLogin} className="space-y-4">
               {error && (
                 <Alert variant="destructive">
                   <AlertCircle className="h-4 w-4" />
                   <AlertDescription>{error}</AlertDescription>
                 </Alert>
               )}
 
               <div className="space-y-2">
                 <Label htmlFor="email">Admin Email</Label>
                 <div className="relative">
                   <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                   <Input
                     id="email"
                     type="email"
                     placeholder="admin@handyhive.com"
                     value={email}
                     onChange={(e) => setEmail(e.target.value)}
                     className="pl-10"
                     disabled={isLoading}
                     required
                   />
                 </div>
               </div>
 
               <div className="space-y-2">
                 <Label htmlFor="password">Password</Label>
                 <div className="relative">
                   <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                   <Input
                     id="password"
                     type="password"
                     placeholder="••••••••"
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                     className="pl-10"
                     disabled={isLoading}
                     required
                   />
                 </div>
               </div>
 
               <Button type="submit" className="w-full" disabled={isLoading}>
                 {isLoading ? (
                   <>
                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                     Authenticating...
                   </>
                 ) : (
                   <>
                     <Shield className="mr-2 h-4 w-4" />
                     Login to Admin Panel
                   </>
                 )}
               </Button>
             </form>
 
             <div className="mt-6 rounded-lg bg-accent/50 p-4">
               <div className="flex items-start gap-3">
                 <AlertCircle className="mt-0.5 h-5 w-5 text-muted-foreground" />
                 <div className="text-sm text-muted-foreground">
                   <p className="font-medium text-foreground">Restricted Access</p>
                   <p className="mt-1">
                     This login is only for authorized administrators. Unauthorized access
                     attempts are logged and monitored.
                   </p>
                 </div>
               </div>
             </div>
           </CardContent>
         </Card>
       </main>
 
       {/* Footer */}
       <footer className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
         <p>&copy; {new Date().getFullYear()} HandyHive. All rights reserved.</p>
       </footer>
     </div>
   );
 };
 
 export default AdminLogin;