import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Provider {
  id: string;
  user_id: string;
  full_name: string;
  email: string | null;
  mobile: string | null;
  avatar_url: string | null;
  primary_skill: string | null;
  service_location: string | null;
  service_description: string | null;
  average_rating: number | null;
  total_reviews: number | null;
  is_verified: boolean | null;
  kyc_status: string | null;
  skills: ProviderSkill[];
  service_areas: ServiceArea[];
}

export interface ProviderSkill {
  id: string;
  skill_name: string;
  experience_years: number | null;
  is_primary: boolean | null;
}

export interface ServiceArea {
  id: string;
  area_name: string;
  pincode: string | null;
}

interface UseProvidersOptions {
  category?: string;
  searchQuery?: string;
  verifiedOnly?: boolean;
}

export const useProviders = (options: UseProvidersOptions = {}) => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProviders();
  }, [options.category, options.searchQuery, options.verifiedOnly]);

  const fetchProviders = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch providers with is_provider = true and approved KYC
      let query = supabase
        .from("users")
        .select("*")
        .eq("is_provider", true)
        .eq("kyc_status", "approved");

      if (options.verifiedOnly) {
        query = query.eq("is_verified", true);
      }

      const { data: usersData, error: usersError } = await query;

      if (usersError) throw usersError;

      if (!usersData || usersData.length === 0) {
        setProviders([]);
        return;
      }

      // Get provider IDs
      const providerIds = usersData.map((u) => u.user_id);

      // Fetch skills for all providers
      const { data: skillsData } = await supabase
        .from("provider_skills")
        .select("*")
        .in("provider_id", providerIds);

      // Fetch service areas for all providers
      const { data: areasData } = await supabase
        .from("provider_service_areas")
        .select("*")
        .in("provider_id", providerIds);

      // Map skills and areas to providers
      const providersWithDetails: Provider[] = usersData.map((user) => ({
        id: user.id,
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        mobile: user.mobile,
        avatar_url: user.avatar_url,
        primary_skill: user.primary_skill,
        service_location: user.service_location,
        service_description: user.service_description,
        average_rating: user.average_rating,
        total_reviews: user.total_reviews,
        is_verified: user.is_verified,
        kyc_status: user.kyc_status,
        skills: (skillsData || []).filter((s) => s.provider_id === user.user_id),
        service_areas: (areasData || []).filter((a) => a.provider_id === user.user_id),
      }));

      // Filter by category if specified
      let filteredProviders = providersWithDetails;
      
      if (options.category && options.category !== "all") {
        filteredProviders = filteredProviders.filter((p) => {
          const primarySkillMatch = p.primary_skill?.toLowerCase().includes(options.category!.toLowerCase());
          const skillsMatch = p.skills.some((s) => 
            s.skill_name.toLowerCase().includes(options.category!.toLowerCase())
          );
          return primarySkillMatch || skillsMatch;
        });
      }

      // Filter by search query if specified
      if (options.searchQuery) {
        const query = options.searchQuery.toLowerCase();
        filteredProviders = filteredProviders.filter((p) => {
          const nameMatch = p.full_name.toLowerCase().includes(query);
          const skillMatch = p.skills.some((s) => s.skill_name.toLowerCase().includes(query));
          const locationMatch = p.service_location?.toLowerCase().includes(query);
          const descMatch = p.service_description?.toLowerCase().includes(query);
          return nameMatch || skillMatch || locationMatch || descMatch;
        });
      }

      // Sort by rating (highest first), then by reviews count
      filteredProviders.sort((a, b) => {
        const ratingA = a.average_rating || 0;
        const ratingB = b.average_rating || 0;
        if (ratingB !== ratingA) return ratingB - ratingA;
        return (b.total_reviews || 0) - (a.total_reviews || 0);
      });

      setProviders(filteredProviders);
    } catch (err: any) {
      console.error("Error fetching providers:", err);
      setError(err.message || "Failed to load providers");
    } finally {
      setIsLoading(false);
    }
  };

  return { providers, isLoading, error, refetch: fetchProviders };
};

export const useProvider = (providerId: string | undefined) => {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (providerId) {
      fetchProvider();
    }
  }, [providerId]);

  const fetchProvider = async () => {
    if (!providerId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Try to fetch by user_id first, then by id
      let { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("user_id", providerId)
        .eq("is_provider", true)
        .single();

      if (userError || !userData) {
        // Try by id
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", providerId)
          .eq("is_provider", true)
          .single();
        
        if (error) throw error;
        userData = data;
      }

      if (!userData) {
        throw new Error("Provider not found");
      }

      // Fetch skills
      const { data: skillsData } = await supabase
        .from("provider_skills")
        .select("*")
        .eq("provider_id", userData.user_id);

      // Fetch service areas
      const { data: areasData } = await supabase
        .from("provider_service_areas")
        .select("*")
        .eq("provider_id", userData.user_id);

      const providerWithDetails: Provider = {
        id: userData.id,
        user_id: userData.user_id,
        full_name: userData.full_name,
        email: userData.email,
        mobile: userData.mobile,
        avatar_url: userData.avatar_url,
        primary_skill: userData.primary_skill,
        service_location: userData.service_location,
        service_description: userData.service_description,
        average_rating: userData.average_rating,
        total_reviews: userData.total_reviews,
        is_verified: userData.is_verified,
        kyc_status: userData.kyc_status,
        skills: skillsData || [],
        service_areas: areasData || [],
      };

      setProvider(providerWithDetails);
    } catch (err: any) {
      console.error("Error fetching provider:", err);
      setError(err.message || "Failed to load provider");
    } finally {
      setIsLoading(false);
    }
  };

  return { provider, isLoading, error, refetch: fetchProvider };
};
