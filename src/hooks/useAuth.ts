import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string | null;
  mobile: string | null;
  role: "customer" | "admin";
  is_provider: boolean;
  avatar_url: string | null;
  is_verified: boolean | null;
  kyc_status: string | null;
  primary_skill: string | null;
  service_location: string | null;
  average_rating: number | null;
  total_reviews: number | null;
}

interface UseAuthReturn {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isProvider: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!error && data) {
      setProfile(data as UserProfile);
    }

    // Check admin role from user_roles table
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .single();

    setIsAdmin(!!roleData);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer Supabase calls with setTimeout to prevent deadlock
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setIsAdmin(false);
        }

        if (event === "SIGNED_OUT") {
          navigate("/");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate, fetchProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsAdmin(false);
    navigate("/");
  }, [navigate]);

  return {
    user,
    session,
    profile,
    isLoading,
    isAuthenticated: !!session,
    isProvider: profile?.is_provider ?? false,
    isAdmin,
    signOut,
    refreshProfile,
  };
};

// Hook to require authentication - redirects to splash if not authenticated
export const useRequireAuth = (redirectTo = "/") => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate(redirectTo);
      } else {
        setIsAuthenticated(true);
      }
      setIsChecking(false);
    };

    checkAuth();
  }, [navigate, redirectTo]);

  return { isChecking, isAuthenticated };
};

// Hook to require provider capability
export const useRequireProvider = (redirectTo = "/dashboard") => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkProvider = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/");
        setIsChecking(false);
        return;
      }

      const { data: profile } = await supabase
        .from("users")
        .select("is_provider")
        .eq("user_id", user.id)
        .single();

      if (!profile?.is_provider) {
        navigate(redirectTo);
      } else {
        setIsAuthorized(true);
      }
      setIsChecking(false);
    };

    checkProvider();
  }, [navigate, redirectTo]);

  return { isChecking, isAuthorized };
};

// Hook to require admin role
export const useRequireAdmin = (redirectTo = "/dashboard") => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/");
        setIsChecking(false);
        return;
      }

      // Check admin role from user_roles table
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      if (!roleData) {
        navigate(redirectTo);
      } else {
        setIsAuthorized(true);
      }
      setIsChecking(false);
    };

    checkAdmin();
  }, [navigate, redirectTo]);

  return { isChecking, isAuthorized };
};

// Hook to redirect authenticated users away from public pages
export const useRedirectIfAuthenticated = (redirectTo = "/dashboard") => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate(redirectTo);
      }
      setIsChecking(false);
    };

    checkAuth();

    // Also listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          navigate(redirectTo);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate, redirectTo]);

  return { isChecking };
};
