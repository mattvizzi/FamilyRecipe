import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { RecipeCard, RecipeCardSkeleton } from "@/features/recipes/components/recipe-card";
import { useAuth } from "@/hooks/use-auth";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutGrid, List, Search, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import type { RecipeWithCreator, Family, RecipeCategory } from "@shared/schema";
import { recipeCategories } from "@shared/schema";
import { SEO } from "@/components/seo";

type RecipeFilter = "all" | "family" | "saved";

const filterLabels: Record<RecipeFilter, string> = {
  "all": "All",
  "family": "Family",
  "saved": "Saved",
};

export default function Home() {
  const params = useParams<{ category?: string }>();
  const [, navigate] = useLocation();
  const category = params.category || "all";
  const { user } = useAuth();
  
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [recipeFilter, setRecipeFilter] = useState<RecipeFilter>("all");

  const { data: family, isLoading: familyLoading } = useQuery<Family>({
    queryKey: ["/api/family"],
  });

  const { data: familyRecipes = [], isLoading: familyRecipesLoading } = useQuery<RecipeWithCreator[]>({
    queryKey: ["/api/recipes"],
    enabled: !!family,
  });

  const { data: savedRecipes = [], isLoading: savedRecipesLoading } = useQuery<RecipeWithCreator[]>({
    queryKey: ["/api/recipes/saved"],
    enabled: !!family,
  });

  const isLoading = familyLoading || familyRecipesLoading || savedRecipesLoading;

  const allRecipes = (() => {
    switch (recipeFilter) {
      case "family":
        return familyRecipes;
      case "saved":
        return savedRecipes;
      case "all":
      default:
        return [...familyRecipes, ...savedRecipes.filter(r => !familyRecipes.some(fr => fr.id === r.id))];
    }
  })();

  const filteredRecipes = allRecipes
    .filter((recipe) => {
      const matchesSearch = recipe.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = category === "all" || recipe.category.toLowerCase() === category.toLowerCase();
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const handleCategoryChange = (cat: string) => {
    if (cat === "all") {
      navigate("/family-recipes");
    } else {
      navigate(`/family-recipes/${cat.toLowerCase()}`);
    }
  };

  const pageTitle = category === "all" 
    ? "Family Recipes" 
    : `${category.charAt(0).toUpperCase() + category.slice(1)} Recipes`;

  return (
    <>
      <SEO 
        title={pageTitle}
        description="Your personal recipe collection. View, organize, and manage your family's favorite recipes."
        noindex={true}
      />
      <main className="pt-20 sm:pt-28 pb-12 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-foreground" data-testid="text-page-title">
              Family Recipes
            </h1>
          </div>

          {/* Filter Tabs: All / Family / Saved */}
          <Tabs value={recipeFilter} onValueChange={(v) => setRecipeFilter(v as RecipeFilter)} className="mb-4">
            <TabsList className="grid w-full max-w-xs grid-cols-3">
              <TabsTrigger value="all" data-testid="tab-all">All</TabsTrigger>
              <TabsTrigger value="family" data-testid="tab-family">Family</TabsTrigger>
              <TabsTrigger value="saved" data-testid="tab-saved">Saved</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Horizontal Scrolling Category Chips */}
          <div className="relative mb-4">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <Button
                variant={category === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => handleCategoryChange("all")}
                className="flex-shrink-0"
                data-testid="button-category-all"
              >
                All
              </Button>
              {recipeCategories.map((cat) => (
                <Button
                  key={cat}
                  variant={category.toLowerCase() === cat.toLowerCase() ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleCategoryChange(cat)}
                  className="flex-shrink-0"
                  data-testid={`button-category-${cat.toLowerCase()}`}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          {/* Search and View Toggle */}
          <div className="flex gap-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search recipes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
            <div className="flex border border-border rounded-lg overflow-hidden">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("grid")}
                aria-label="Grid view"
                data-testid="button-grid-view"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("list")}
                aria-label="List view"
                data-testid="button-list-view"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className={viewMode === "grid" 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
              : "flex flex-col gap-4"
            }>
              {[...Array(8)].map((_, i) => (
                <RecipeCardSkeleton key={i} viewMode={viewMode} />
              ))}
            </div>
          ) : familyRecipes.length === 0 && savedRecipes.length === 0 ? (
            <EmptyState />
          ) : (
            <>

              {filteredRecipes.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-muted-foreground" data-testid="text-no-results">
                    {recipeFilter === "saved" 
                      ? "You haven't saved any recipes yet" 
                      : searchQuery || category !== "all"
                        ? "No recipes match your search"
                        : "No recipes found"}
                  </p>
                  {recipeFilter === "saved" && (
                    <p className="text-muted-foreground/70 text-sm mt-2">
                      Browse public recipes and save your favorites!
                    </p>
                  )}
                </div>
              ) : (
                <div className={`animate-stagger ${viewMode === "grid" 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
                  : "grid grid-cols-1 md:grid-cols-2 gap-4"
                }`}>
                  {filteredRecipes.map((recipe) => {
                    const isOwner = recipe.createdById === user?.id;
                    return (
                      <RecipeCard 
                        key={recipe.id} 
                        recipe={recipe} 
                        viewMode={viewMode}
                        showCreator={isOwner}
                        showVisibility={isOwner}
                      />
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        </main>
    </>
  );
}
