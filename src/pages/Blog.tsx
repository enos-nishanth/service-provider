import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Hexagon, BookOpen } from "lucide-react";

const Blog = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Hexagon className="h-6 w-6 text-primary-foreground" fill="currentColor" />
              </div>
              <span className="text-xl font-bold">
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
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="flex items-center gap-3 mb-8">
          <BookOpen className="h-10 w-10 text-primary" />
          <h1 className="text-4xl font-bold">Blog</h1>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="h-48 bg-accent/50" />
            <div className="p-6">
              <h3 className="font-semibold text-lg mb-2">Coming Soon</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Stay tuned for helpful tips, industry insights, and updates from HandyHive.
              </p>
              <p className="text-xs text-muted-foreground">February 20, 2026</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Blog;
