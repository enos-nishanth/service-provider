import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Booking {
  id: string;
  booking_id: string;
  customer_id: string;
  provider_id: string;
  service_category: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  payment_method: string;
  payment_status: string;
  total_amount: number;
  subtotal: number;
  tax: number;
  visit_charge: number;
  customer_address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingWithDetails extends Booking {
  provider?: {
    full_name: string;
    mobile: string | null;
    avatar_url: string | null;
    average_rating: number | null;
  };
  customer?: {
    full_name: string;
    email: string | null;
    mobile: string | null;
  };
}

interface UseBookingsOptions {
  role: "customer" | "provider";
  status?: string | string[];
  limit?: number;
}

export const useBookings = (options: UseBookingsOptions) => {
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();

    // Real-time subscription
    const channel = supabase
      .channel("bookings-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        () => {
          fetchBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [options.role, options.status]);

  const fetchBookings = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Please sign in to view bookings");
        return;
      }

      const userIdField = options.role === "customer" ? "customer_id" : "provider_id";
      
      let query = supabase
        .from("bookings")
        .select("*")
        .eq(userIdField, user.id)
        .order("created_at", { ascending: false });

      if (options.status) {
        if (Array.isArray(options.status)) {
          query = query.in("status", options.status);
        } else {
          query = query.eq("status", options.status);
        }
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error: bookingsError } = await query;

      if (bookingsError) throw bookingsError;

      if (!data || data.length === 0) {
        setBookings([]);
        return;
      }

      // Fetch related user info from users table
      const relatedUserIds = [...new Set(
        data.map((b) => options.role === "customer" ? b.provider_id : b.customer_id)
      )];

      const { data: usersData } = await supabase
        .from("users")
        .select("user_id, full_name, email, mobile, avatar_url, average_rating")
        .in("user_id", relatedUserIds);

      const usersMap = new Map(usersData?.map((u) => [u.user_id, u]));

      const bookingsWithDetails: BookingWithDetails[] = data.map((booking) => {
        const relatedUser = usersMap.get(
          options.role === "customer" ? booking.provider_id : booking.customer_id
        );

        return {
          ...booking,
          ...(options.role === "customer"
            ? {
                provider: relatedUser
                  ? {
                      full_name: relatedUser.full_name,
                      mobile: relatedUser.mobile,
                      avatar_url: relatedUser.avatar_url,
                      average_rating: relatedUser.average_rating,
                    }
                  : undefined,
              }
            : {
                customer: relatedUser
                  ? {
                      full_name: relatedUser.full_name,
                      email: relatedUser.email,
                      mobile: relatedUser.mobile,
                    }
                  : undefined,
              }),
        };
      });

      setBookings(bookingsWithDetails);
    } catch (err: any) {
      console.error("Error fetching bookings:", err);
      setError(err.message || "Failed to load bookings");
    } finally {
      setIsLoading(false);
    }
  };

  return { bookings, isLoading, error, refetch: fetchBookings };
};

export const useBookingStats = (role: "customer" | "provider") => {
  const [stats, setStats] = useState({
    total: 0,
    ongoing: 0,
    completed: 0,
    cancelled: 0,
    totalSpent: 0,
    totalEarned: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [role]);

  const fetchStats = async () => {
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const userIdField = role === "customer" ? "customer_id" : "provider_id";

      const { data, error } = await supabase
        .from("bookings")
        .select("status, total_amount, payment_status")
        .eq(userIdField, user.id);

      if (error) throw error;

      const bookings = data || [];
      const ongoing = bookings.filter((b) =>
        ["requested", "accepted", "in_progress"].includes(b.status)
      ).length;
      const completed = bookings.filter((b) => b.status === "completed").length;
      const cancelled = bookings.filter((b) => b.status === "cancelled").length;
      const completedBookings = bookings.filter((b) => b.status === "completed");
      const totalAmount = completedBookings.reduce((sum, b) => sum + b.total_amount, 0);

      setStats({
        total: bookings.length,
        ongoing,
        completed,
        cancelled,
        totalSpent: role === "customer" ? totalAmount : 0,
        totalEarned: role === "provider" ? totalAmount : 0,
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return { stats, isLoading, refetch: fetchStats };
};

export const useReviewStats = (role: "customer" | "provider") => {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReviewCount();
  }, [role]);

  const fetchReviewCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const userIdField = role === "customer" ? "customer_id" : "provider_id";

      const { count: reviewCount, error } = await supabase
        .from("reviews")
        .select("*", { count: "exact", head: true })
        .eq(userIdField, user.id);

      if (!error && reviewCount !== null) {
        setCount(reviewCount);
      }
    } catch (err) {
      console.error("Error fetching review count:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return { count, isLoading };
};
