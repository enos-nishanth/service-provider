import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, MapPin, Clock, User, ShieldCheck } from "lucide-react";
import { useProviders, Provider } from "@/hooks/useProviders";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";

interface ProviderListProps {
  categoryId: string;
  searchQuery?: string;
}

const ProviderCardSkeleton = () => (
  <Card className="overflow-hidden border-border/50">
    <CardContent className="p-4">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div>
            <Skeleton className="mb-2 h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <Skeleton className="h-5 w-16" />
      </div>
      <div className="mb-3 flex flex-wrap gap-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-18" />
      </div>
      <Skeleton className="h-9 w-full" />
    </CardContent>
  </Card>
);

const ProviderCard = ({ provider }: { provider: Provider }) => {
  const initials = provider.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const displaySkills = provider.skills.slice(0, 3).map((s) => s.skill_name);
  const primarySkill = provider.skills.find((s) => s.is_primary);
  const experienceYears = primarySkill?.experience_years || 
    Math.max(...provider.skills.map((s) => s.experience_years || 0));

  return (
    <Card className="overflow-hidden border-border/50 transition-all hover:-translate-y-1 hover:shadow-md">
      <CardContent className="p-4">
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-3">
            {provider.avatar_url ? (
              <img
                src={provider.avatar_url}
                alt={provider.full_name}
                className="h-12 w-12 rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
                {initials}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">{provider.full_name}</h3>
                {provider.is_verified && (
                  <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 text-xs">
                    <ShieldCheck className="mr-1 h-3 w-3" />
                    Verified
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="h-3.5 w-3.5 text-primary" fill="currentColor" />
                <span className="font-medium text-foreground">
                  {provider.average_rating?.toFixed(1) || "New"}
                </span>
                {provider.total_reviews && provider.total_reviews > 0 && (
                  <span>({provider.total_reviews})</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
          {provider.service_location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {provider.service_location}
            </div>
          )}
          {experienceYears > 0 && (
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {experienceYears} {experienceYears === 1 ? "year" : "years"} exp
            </div>
          )}
        </div>

        {displaySkills.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {displaySkills.map((skill) => (
              <Badge key={skill} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
            {provider.skills.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{provider.skills.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {provider.service_description && (
          <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">
            {provider.service_description}
          </p>
        )}

        <Button className="w-full" size="sm" asChild>
          <Link to={`/book/${provider.user_id}`}>Book Now</Link>
        </Button>
      </CardContent>
    </Card>
  );
};

const ProviderList = ({ categoryId, searchQuery = "" }: ProviderListProps) => {
  const { providers, isLoading, error, refetch } = useProviders({
    category: categoryId,
    searchQuery,
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <ProviderCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={refetch} />;
  }

  if (providers.length === 0) {
    return (
      <EmptyState
        icon={User}
        title="No providers available"
        description={searchQuery
          ? "No providers match your search. Try different keywords."
          : "No verified providers are available in this category yet. Please check back later."}
        actionLabel={searchQuery ? "Clear search" : undefined}
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {providers.map((provider) => (
        <ProviderCard key={provider.id} provider={provider} />
      ))}
    </div>
  );
};

export default ProviderList;
