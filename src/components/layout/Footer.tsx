 import { Link } from "react-router-dom";
 import { Hexagon, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
 
 const Footer = () => {
   return (
     <footer className="border-t border-border bg-card">
       <div className="container mx-auto px-4 py-12">
         <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
           {/* Brand */}
           <div className="space-y-4">
             <Link to="/" className="flex items-center gap-2">
               <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                 <Hexagon className="h-5 w-5 text-primary-foreground" fill="currentColor" />
               </div>
               <span className="text-xl font-bold text-foreground">
                 Handy<span className="text-primary">Hive</span>
               </span>
             </Link>
             <p className="text-sm text-muted-foreground">
               Connecting you with trusted local service providers for all your home needs.
             </p>
             <div className="flex gap-4">
               <a href="#" className="text-muted-foreground hover:text-primary">
                 <Facebook className="h-5 w-5" />
               </a>
               <a href="#" className="text-muted-foreground hover:text-primary">
                 <Twitter className="h-5 w-5" />
               </a>
               <a href="#" className="text-muted-foreground hover:text-primary">
                 <Instagram className="h-5 w-5" />
               </a>
               <a href="#" className="text-muted-foreground hover:text-primary">
                 <Linkedin className="h-5 w-5" />
               </a>
             </div>
           </div>
 
           {/* Services */}
           <div>
             <h4 className="mb-4 font-semibold text-foreground">Services</h4>
             <ul className="space-y-2 text-sm text-muted-foreground">
               <li><Link to="/services" className="hover:text-primary">Plumbing</Link></li>
               <li><Link to="/services" className="hover:text-primary">Electrical</Link></li>
               <li><Link to="/services" className="hover:text-primary">Carpentry</Link></li>
               <li><Link to="/services" className="hover:text-primary">AC Repair</Link></li>
               <li><Link to="/services" className="hover:text-primary">Painting</Link></li>
             </ul>
           </div>
 
           {/* Company */}
           <div>
             <h4 className="mb-4 font-semibold text-foreground">Company</h4>
             <ul className="space-y-2 text-sm text-muted-foreground">
               <li><Link to="/about" className="hover:text-primary">About Us</Link></li>
               <li><Link to="/careers" className="hover:text-primary">Careers</Link></li>
               <li><Link to="/blog" className="hover:text-primary">Blog</Link></li>
               <li><Link to="/contact" className="hover:text-primary">Contact</Link></li>
             </ul>
           </div>
 
           {/* Support */}
           <div>
             <h4 className="mb-4 font-semibold text-foreground">Support</h4>
             <ul className="space-y-2 text-sm text-muted-foreground">
               <li><Link to="/help" className="hover:text-primary">Help Center</Link></li>
               <li><Link to="/safety" className="hover:text-primary">Safety</Link></li>
               <li><Link to="/terms" className="hover:text-primary">Terms of Service</Link></li>
               <li><Link to="/privacy" className="hover:text-primary">Privacy Policy</Link></li>
             </ul>
           </div>
         </div>
 
         <div className="mt-12 border-t border-border pt-8 text-center text-sm text-muted-foreground">
           <p>© {new Date().getFullYear()} HandyHive. All rights reserved.</p>
         </div>
       </div>
     </footer>
   );
 };
 
 export default Footer;