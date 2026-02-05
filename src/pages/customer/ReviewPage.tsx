 import { useState, useEffect } from "react";
 import { useParams, useNavigate, Link } from "react-router-dom";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Textarea } from "@/components/ui/textarea";
 import { Badge } from "@/components/ui/badge";
 import { Separator } from "@/components/ui/separator";
 import {
   Hexagon,
   ArrowLeft,
   Star,
   Calendar,
   Clock,
   CheckCircle2,
   Loader2,
   User,
   Send,
 } from "lucide-react";
 import { format } from "date-fns";
 import { cn } from "@/lib/utils";
 import { supabase } from "@/integrations/supabase/client";
 import { useToast } from "@/hooks/use-toast";
 import { createNotification } from "@/hooks/useNotifications";
 
 interface Booking {
   id: string;
   booking_id: string;
   service_category: string;
   scheduled_date: string;
   scheduled_time: string;
   status: string;
   provider_id: string;
   total_amount: number;
 }
 
 const ReviewPage = () => {
   const { bookingId } = useParams();
   const navigate = useNavigate();
   const { toast } = useToast();
   const [booking, setBooking] = useState<Booking | null>(null);
   const [rating, setRating] = useState(0);
   const [hoveredRating, setHoveredRating] = useState(0);
   const [feedback, setFeedback] = useState("");
   const [isLoading, setIsLoading] = useState(true);
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [hasReviewed, setHasReviewed] = useState(false);
 
   useEffect(() => {
     const fetchBookingAndReview = async () => {
       if (!bookingId) return;
 
       try {
         // Fetch booking
         const { data: bookingData, error: bookingError } = await supabase
           .from("bookings")
           .select("*")
           .eq("booking_id", bookingId)
           .single();
 
         if (bookingError) throw bookingError;
         setBooking(bookingData);
 
         // Check if already reviewed
         const { data: reviewData } = await supabase
           .from("reviews")
           .select("*")
           .eq("booking_id", bookingData.id)
           .single();
 
         if (reviewData) {
           setHasReviewed(true);
           setRating(reviewData.rating);
           setFeedback(reviewData.feedback || "");
         }
       } catch (error: any) {
         console.error("Error fetching data:", error);
         toast({
           title: "Error",
           description: "Could not load booking details",
           variant: "destructive",
         });
       } finally {
         setIsLoading(false);
       }
     };
 
     fetchBookingAndReview();
   }, [bookingId, toast]);
 
   const handleSubmitReview = async () => {
     if (!booking || rating === 0) {
       toast({
         title: "Rating required",
         description: "Please select a star rating",
         variant: "destructive",
       });
       return;
     }
 
     if (booking.status !== "completed") {
       toast({
         title: "Cannot review",
         description: "You can only review completed bookings",
         variant: "destructive",
       });
       return;
     }
 
     setIsSubmitting(true);
 
     try {
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) {
         navigate("/auth");
         return;
       }
 
       const { error } = await supabase.from("reviews").insert({
         booking_id: booking.id,
         customer_id: user.id,
         provider_id: booking.provider_id,
         rating: rating,
         feedback: feedback.trim() || null,
       });
 
       if (error) throw error;
 
       // Notify provider about the new review
       await createNotification(
         booking.provider_id,
         `New ${rating}-Star Review! ⭐`,
         feedback.trim() ? `"${feedback.trim().substring(0, 100)}${feedback.length > 100 ? '...' : ''}"` : `You received a ${rating}-star review for your ${booking.service_category} service.`,
         "review",
         "/provider/bookings"
       );
 
       toast({
         title: "Review submitted!",
         description: "Thank you for your feedback",
       });
 
       setHasReviewed(true);
     } catch (error: any) {
       console.error("Error submitting review:", error);
       toast({
         title: "Error",
         description: error.message || "Could not submit review",
         variant: "destructive",
       });
     } finally {
       setIsSubmitting(false);
     }
   };
 
   const ratingLabels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];
 
   if (isLoading) {
     return (
       <div className="flex min-h-screen items-center justify-center bg-background">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
       </div>
     );
   }
 
   if (!booking) {
     return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
          <h1 className="mb-4 text-2xl font-bold">Booking Not Found</h1>
          <Button asChild>
            <Link to="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
     );
   }
 
   if (booking.status !== "completed") {
     return (
       <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
         <div className="text-center">
           <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
             <Clock className="h-8 w-8 text-amber-500" />
           </div>
           <h1 className="mb-2 text-2xl font-bold">Service Not Completed</h1>
           <p className="mb-6 text-muted-foreground">
             You can only leave a review after the service is completed.
           </p>
           <Button asChild>
             <Link to={`/booking/${bookingId}`}>Track Booking</Link>
           </Button>
         </div>
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
           <h1 className="text-lg font-semibold">Rate Service</h1>
         </div>
       </header>
 
       <main className="container mx-auto max-w-2xl px-4 py-6">
         {/* Success State */}
         {hasReviewed ? (
           <Card className="text-center">
             <CardContent className="pt-8">
               <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
                 <CheckCircle2 className="h-10 w-10 text-emerald-500" />
               </div>
               <h2 className="mb-2 text-2xl font-bold">Thank You!</h2>
               <p className="mb-6 text-muted-foreground">
                 Your review has been submitted successfully
               </p>
 
               {/* Show submitted review */}
               <div className="mb-6 rounded-lg bg-accent p-4">
                 <div className="mb-2 flex justify-center gap-1">
                   {[1, 2, 3, 4, 5].map((star) => (
                     <Star
                       key={star}
                       className={cn(
                         "h-6 w-6",
                         star <= rating
                           ? "fill-amber-400 text-amber-400"
                           : "text-muted-foreground/30"
                       )}
                     />
                   ))}
                 </div>
                 <p className="font-medium text-foreground">{ratingLabels[rating]}</p>
                 {feedback && (
                   <p className="mt-2 text-sm text-muted-foreground">"{feedback}"</p>
                 )}
               </div>
 
                <div className="flex flex-col gap-3">
                  <Button asChild>
                    <Link to="/dashboard">Go to Dashboard</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/bookings">View All Bookings</Link>
                  </Button>
               </div>
             </CardContent>
           </Card>
         ) : (
           <div className="space-y-6">
             {/* Booking Summary */}
             <Card>
               <CardHeader>
                 <CardTitle className="text-base">Service Completed</CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="flex items-center gap-4">
                   <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                     <User className="h-7 w-7 text-primary" />
                   </div>
                   <div className="flex-1">
                     <p className="font-semibold text-foreground">Service Provider</p>
                     <Badge variant="secondary" className="mt-1 capitalize">
                       {booking.service_category.replace("-", " ")}
                     </Badge>
                   </div>
                   <div className="text-right">
                     <p className="text-sm text-muted-foreground">Booking ID</p>
                     <p className="font-mono text-sm font-medium">{booking.booking_id}</p>
                   </div>
                 </div>
                 <Separator className="my-4" />
                 <div className="flex gap-6 text-sm text-muted-foreground">
                   <span className="flex items-center gap-2">
                     <Calendar className="h-4 w-4" />
                     {format(new Date(booking.scheduled_date), "MMM d, yyyy")}
                   </span>
                   <span className="flex items-center gap-2">
                     <Clock className="h-4 w-4" />
                     {booking.scheduled_time}
                   </span>
                 </div>
               </CardContent>
             </Card>
 
             {/* Rating Section */}
             <Card>
               <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <Star className="h-5 w-5 text-primary" />
                   Rate Your Experience
                 </CardTitle>
                 <p className="text-sm text-muted-foreground">
                   How was the service quality?
                 </p>
               </CardHeader>
               <CardContent>
                 {/* Star Rating */}
                 <div className="mb-4 flex flex-col items-center">
                   <div className="mb-2 flex gap-2">
                     {[1, 2, 3, 4, 5].map((star) => (
                       <button
                         key={star}
                         type="button"
                         onClick={() => setRating(star)}
                         onMouseEnter={() => setHoveredRating(star)}
                         onMouseLeave={() => setHoveredRating(0)}
                         className="rounded-lg p-1 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary"
                       >
                         <Star
                           className={cn(
                             "h-10 w-10 transition-colors",
                             (hoveredRating || rating) >= star
                               ? "fill-amber-400 text-amber-400"
                               : "text-muted-foreground/30 hover:text-amber-300"
                           )}
                         />
                       </button>
                     ))}
                   </div>
                   <p
                     className={cn(
                       "text-lg font-medium transition-opacity",
                       rating > 0 ? "opacity-100" : "opacity-0"
                     )}
                   >
                     {ratingLabels[hoveredRating || rating]}
                   </p>
                 </div>
 
                 <Separator className="my-4" />
 
                 {/* Written Feedback */}
                 <div className="space-y-2">
                   <label className="text-sm font-medium text-foreground">
                     Share your experience (optional)
                   </label>
                   <Textarea
                     placeholder="Tell us about your experience with the service..."
                     value={feedback}
                     onChange={(e) => setFeedback(e.target.value)}
                     rows={4}
                     className="resize-none"
                   />
                   <p className="text-xs text-muted-foreground">
                     Your feedback helps other customers and the service provider
                   </p>
                 </div>
               </CardContent>
             </Card>
 
             {/* Submit Button */}
             <Button
               size="lg"
               className="w-full"
               onClick={handleSubmitReview}
               disabled={rating === 0 || isSubmitting}
             >
               {isSubmitting ? (
                 <>
                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                   Submitting...
                 </>
               ) : (
                 <>
                   <Send className="mr-2 h-4 w-4" />
                   Submit Review
                 </>
               )}
             </Button>
 
             <p className="text-center text-xs text-muted-foreground">
               Your review will be visible to the service provider and other customers
             </p>
           </div>
         )}
       </main>
     </div>
   );
 };
 
 export default ReviewPage;