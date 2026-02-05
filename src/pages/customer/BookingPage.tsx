import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Hexagon,
  ArrowLeft,
  ArrowRight,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Star,
  CheckCircle2,
  CreditCard,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useProvider } from "@/hooks/useProviders";
import { supabase } from "@/integrations/supabase/client";
import ErrorState from "@/components/common/ErrorState";

type BookingStep = "date" | "time" | "confirm";

interface TimeSlot {
  id: number;
  time: string;
  available: boolean;
}

const BASE_SERVICE_PRICE = 299;
const VISIT_CHARGE = 49;

const BookingPage = () => {
  const { providerId } = useParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<BookingStep>("date");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const { provider, isLoading, error, refetch } = useProvider(providerId);

  // Generate time slots based on provider's schedule
  useEffect(() => {
    if (selectedDate && providerId) {
      fetchAvailableSlots();
    }
  }, [selectedDate, providerId]);

  const fetchAvailableSlots = async () => {
    if (!selectedDate || !providerId) return;

    setSlotsLoading(true);
    try {
      const dayOfWeek = selectedDate.getDay();

      // Fetch provider's schedule for this day
      const { data: scheduleData } = await supabase
        .from("provider_schedules")
        .select("*")
        .eq("provider_id", providerId)
        .eq("day_of_week", dayOfWeek)
        .single();

      // Fetch existing bookings for this date
      const { data: existingBookings } = await supabase
        .from("bookings")
        .select("scheduled_time")
        .eq("provider_id", providerId)
        .eq("scheduled_date", format(selectedDate, "yyyy-MM-dd"))
        .neq("status", "cancelled");

      const bookedTimes = new Set(existingBookings?.map((b) => b.scheduled_time) || []);

      // Generate time slots
      const defaultSlots = [
        "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
        "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM"
      ];

      let availableSlots: string[] = defaultSlots;

      if (scheduleData) {
        if (!scheduleData.is_working) {
          availableSlots = [];
        } else {
          // Filter based on start/end time (simplified)
          const startHour = parseInt(scheduleData.start_time.split(":")[0]);
          const endHour = parseInt(scheduleData.end_time.split(":")[0]);
          
          availableSlots = defaultSlots.filter((slot) => {
            const slotHour = parseInt(slot.split(":")[0]);
            const isPM = slot.includes("PM") && !slot.includes("12:");
            const actualHour = isPM ? slotHour + 12 : slotHour === 12 ? 12 : slotHour;
            return actualHour >= startHour && actualHour < endHour;
          });
        }
      }

      const slots: TimeSlot[] = availableSlots.map((time, index) => ({
        id: index + 1,
        time,
        available: !bookedTimes.has(time),
      }));

      setTimeSlots(slots);
    } catch (err) {
      console.error("Error fetching slots:", err);
      // Fallback to default slots
      setTimeSlots([
        { id: 1, time: "09:00 AM", available: true },
        { id: 2, time: "10:00 AM", available: true },
        { id: 3, time: "11:00 AM", available: true },
        { id: 4, time: "12:00 PM", available: true },
        { id: 5, time: "02:00 PM", available: true },
        { id: 6, time: "03:00 PM", available: true },
        { id: 7, time: "04:00 PM", available: true },
        { id: 8, time: "05:00 PM", available: true },
        { id: 9, time: "06:00 PM", available: true },
      ]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const steps = [
    { id: "date", label: "Select Date", icon: CalendarIcon },
    { id: "time", label: "Select Time", icon: Clock },
    { id: "confirm", label: "Confirm", icon: CheckCircle2 },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  const canProceed = () => {
    if (currentStep === "date") return !!selectedDate;
    if (currentStep === "time") return !!selectedTime;
    return true;
  };

  const handleNext = () => {
    if (currentStep === "date" && selectedDate) {
      setCurrentStep("time");
    } else if (currentStep === "time" && selectedTime) {
      setCurrentStep("confirm");
    }
  };

  const handleBack = () => {
    if (currentStep === "time") {
      setCurrentStep("date");
      setSelectedTime(null);
    } else if (currentStep === "confirm") {
      setCurrentStep("time");
    }
  };

  const handleProceedToPayment = () => {
    if (!provider) return;

    navigate("/payment", {
      state: {
        providerId: provider.user_id,
        date: selectedDate,
        time: selectedTime,
        provider: {
          id: provider.user_id,
          name: provider.full_name,
          category: provider.primary_skill || provider.skills[0]?.skill_name || "Service",
          rating: provider.average_rating || 0,
          reviews: provider.total_reviews || 0,
          location: provider.service_location || "Location not specified",
          avatar: provider.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2),
          basePrice: BASE_SERVICE_PRICE,
          visitCharge: VISIT_CHARGE,
        },
      },
    });
  };

  // Calculate pricing
  const subtotal = BASE_SERVICE_PRICE;
  const visitCharge = VISIT_CHARGE;
  const tax = Math.round((subtotal + visitCharge) * 0.18);
  const total = subtotal + visitCharge + tax;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
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
            <Skeleton className="h-6 w-24" />
          </div>
        </header>
        <main className="container mx-auto px-4 py-6">
          <div className="mx-auto max-w-2xl space-y-6">
            <Skeleton className="h-12 w-full" />
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-14 w-14 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
          <div className="container mx-auto flex h-16 items-center px-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="ml-4 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Hexagon className="h-5 w-5 text-primary-foreground" fill="currentColor" />
              </div>
              <span className="text-xl font-bold text-foreground">
                Handy<span className="text-primary">Hive</span>
              </span>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-12">
          <ErrorState
            title="Provider not found"
            message={error || "The service provider you're looking for doesn't exist or is no longer available."}
            onRetry={refetch}
          />
        </main>
      </div>
    );
  }

  const providerInitials = provider.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const categoryName = provider.primary_skill || provider.skills[0]?.skill_name || "Service";

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
          <h1 className="text-lg font-semibold">Book Service</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    currentStepIndex >= index
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <step.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{step.label}</span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "mx-2 h-0.5 w-8 sm:w-12",
                      currentStepIndex > index ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Date Selection Step */}
            {currentStep === "date" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-primary" />
                    Select Service Date
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => date < new Date()}
                      className={cn("rounded-md border pointer-events-auto")}
                    />
                  </div>
                  {selectedDate && (
                    <div className="mt-4 rounded-lg bg-accent p-4 text-center">
                      <p className="text-sm text-muted-foreground">Selected Date</p>
                      <p className="text-lg font-semibold text-foreground">
                        {format(selectedDate, "EEEE, MMMM d, yyyy")}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Time Selection Step */}
            {currentStep === "time" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Select Time Slot
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")}
                  </p>
                </CardHeader>
                <CardContent>
                  {slotsLoading ? (
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                        <Skeleton key={i} className="h-12" />
                      ))}
                    </div>
                  ) : timeSlots.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <AlertCircle className="mb-2 h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">No available slots for this date</p>
                      <Button variant="link" onClick={() => setCurrentStep("date")}>
                        Choose another date
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                      {timeSlots.map((slot) => (
                        <Button
                          key={slot.id}
                          variant={selectedTime === slot.time ? "default" : "outline"}
                          className={cn(
                            "h-12",
                            !slot.available && "cursor-not-allowed opacity-50"
                          )}
                          disabled={!slot.available}
                          onClick={() => setSelectedTime(slot.time)}
                        >
                          {slot.time}
                        </Button>
                      ))}
                    </div>
                  )}
                  {selectedTime && (
                    <div className="mt-4 rounded-lg bg-accent p-4 text-center">
                      <p className="text-sm text-muted-foreground">Selected Time</p>
                      <p className="text-lg font-semibold text-foreground">{selectedTime}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Confirmation Step */}
            {currentStep === "confirm" && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      Confirm Booking Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Provider Info */}
                    <div className="flex items-start gap-4 rounded-lg border border-border p-4">
                      {provider.avatar_url ? (
                        <img
                          src={provider.avatar_url}
                          alt={provider.full_name}
                          className="h-14 w-14 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                          {providerInitials}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{provider.full_name}</h3>
                          {provider.is_verified && (
                            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600">
                              <ShieldCheck className="mr-1 h-3 w-3" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        <Badge variant="secondary" className="mt-1">
                          {categoryName}
                        </Badge>
                        <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                            {provider.average_rating?.toFixed(1) || "New"} 
                            {provider.total_reviews ? ` (${provider.total_reviews} reviews)` : ""}
                          </span>
                          {provider.service_location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {provider.service_location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Schedule Info */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-lg border border-border p-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <CalendarIcon className="h-4 w-4" />
                          <span className="text-sm">Date</span>
                        </div>
                        <p className="mt-1 font-semibold text-foreground">
                          {selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")}
                        </p>
                      </div>
                      <div className="rounded-lg border border-border p-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm">Time</span>
                        </div>
                        <p className="mt-1 font-semibold text-foreground">{selectedTime}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Price Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-primary" />
                      Estimated Price
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Service Charge</span>
                        <span className="font-medium">₹{subtotal}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Visit Charge</span>
                        <span className="font-medium">₹{visitCharge}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">GST (18%)</span>
                        <span className="font-medium">₹{tax}</span>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between text-lg font-bold">
                        <span>Total</span>
                        <span className="text-primary">₹{total}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        * Final price may vary based on actual work done
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-6 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === "date"}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>

              {currentStep !== "confirm" ? (
                <Button onClick={handleNext} disabled={!canProceed()}>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-primary to-primary/80"
                  onClick={handleProceedToPayment}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Proceed to Payment
                </Button>
              )}
            </div>
          </div>

          {/* Sidebar - Provider Summary */}
          <div className="hidden lg:block">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-base">Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  {provider.avatar_url ? (
                    <img
                      src={provider.avatar_url}
                      alt={provider.full_name}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                      {providerInitials}
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{provider.full_name}</p>
                    <p className="text-sm text-muted-foreground">{categoryName}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {selectedDate ? format(selectedDate, "MMM d, yyyy") : "Select date"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedTime || "Select time"}</span>
                  </div>
                  {provider.service_location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{provider.service_location}</span>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex items-center justify-between font-semibold">
                  <span>Estimated Total</span>
                  <span className="text-primary">₹{total}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BookingPage;
