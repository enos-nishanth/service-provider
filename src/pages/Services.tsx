import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, 
  Star, 
  MapPin, 
  Calendar,
  Wrench,
  Zap,
  Hammer,
  Wind,
  Paintbrush,
  Droplets,
  User,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { useProviders, Provider } from "@/hooks/useProviders";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";

const categories = [
  { id: "all", label: "All", icon: null },
  { id: "plumbing", label: "Plumbing", icon: Wrench },
  { id: "electrical", label: "Electrical", icon: Zap },
  { id: "carpentry", label: "Carpentry", icon: Hammer },
  { id: "ac", label: "AC Repair", icon: Wind },
  { id: "painting", label: "Painting", icon: Paintbrush },
  { id: "cleaning", label: "Cleaning", icon: Droplets },
];

const ProviderCardSkeleton = () => (
  <Card className="overflow-hidden border-border/50">
    <CardContent className="p-6">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-14 w-14 rounded-xl" />
          <div>
            <Skeleton className="mb-2 h-5 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>
      <Skeleton className="mb-3 h-6 w-20" />
      <div className="mb-4 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-24" />
      </div>
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

  const primarySkill = provider.skills.find((s) => s.is_primary);
  const categoryName = primarySkill?.skill_name || provider.primary_skill || "Service Provider";
  const experienceYears = primarySkill?.experience_years || 
    Math.max(...provider.skills.map((s) => s.experience_years || 0), 0);

  return (
    <Card className="group overflow-hidden border-border/50 transition-all hover:-translate-y-1 hover:shadow-honey">
      <CardContent className="p-6">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            {provider.avatar_url ? (
              <img
                src={provider.avatar_url}
                alt={provider.full_name}
                className="h-14 w-14 rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
                {initials}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">{provider.full_name}</h3>
                {provider.is_verified && (
                  <Badge variant="secondary" className="bg-success/10 text-success">
                    <ShieldCheck className="mr-1 h-3 w-3" />
                    Verified
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="h-4 w-4 text-primary" fill="currentColor" />
                <span className="font-medium text-foreground">
                  {provider.average_rating?.toFixed(1) || "New"}
                </span>
                {provider.total_reviews && provider.total_reviews > 0 && (
                  <span>({provider.total_reviews} reviews)</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-3">
          <Badge variant="outline" className="capitalize">
            {categoryName}
          </Badge>
        </div>

        <div className="mb-4 space-y-2 text-sm text-muted-foreground">
          {provider.service_location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {provider.service_location}
            </div>
          )}
          {experienceYears > 0 && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {experienceYears} {experienceYears === 1 ? "year" : "years"} experience
            </div>
          )}
        </div>

        {provider.service_description && (
          <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
            {provider.service_description}
          </p>
        )}

        <div className="flex items-center justify-end">
          <Button variant="outline" asChild>
            <Link to={`/book/${provider.user_id}`}>Book Service</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const Services = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { providers, isLoading, error, refetch } = useProviders({
    category: selectedCategory === "all" ? undefined : selectedCategory,
    searchQuery: searchQuery || undefined,
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-foreground">Browse Services</h1>
          <p className="text-muted-foreground">Find verified professionals near you</p>
        </div>

        {/* Search */}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search services or providers..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Categories */}
        <div className="mb-8 flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="gap-2"
            >
              {category.icon && <category.icon className="h-4 w-4" />}
              {category.label}
            </Button>
          ))}
        </div>

        {/* Provider Grid */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <ProviderCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : providers.length === 0 ? (
          <EmptyState
            icon={User}
            title="No providers found"
            description={
              searchQuery || selectedCategory !== "all"
                ? "No providers match your criteria. Try adjusting your filters."
                : "No verified service providers are available yet. Please check back later."
            }
            actionLabel={searchQuery || selectedCategory !== "all" ? "Clear filters" : undefined}
            onAction={() => {
              setSelectedCategory("all");
              setSearchQuery("");
            }}
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {providers.map((provider) => (
              <ProviderCard key={provider.id} provider={provider} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Services;
