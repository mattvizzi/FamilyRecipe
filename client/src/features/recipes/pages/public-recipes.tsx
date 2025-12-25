import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { RecipeCard, RecipeCardSkeleton } from "../components/recipe-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LayoutGrid, List, Search, ChefHat, Plus } from "lucide-react";
import type { RecipeWithCreator, Family } from "@shared/schema";
import { recipeCategories } from "@shared/schema";
import { SEO } from "@/components/seo";
import { useAuth } from "@/hooks/use-auth";

const categoryLabels: Record<string, string> = {
  all: "All Recipes",
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snacks",
  appetizer: "Appetizers",
  drink: "Drinks",
  dessert: "Desserts",
};

export default function PublicRecipes() {
  const params = useParams<{ category?: string }>();
  const [, navigate] = useLocation();
  const category = params.category || "all";
  const { user } = useAuth();
  
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: family } = useQuery<Family>({
    queryKey: ["/api/family"],
  });

  const { data: recipes = [], isLoading } = useQuery<RecipeWithCreator[]>({
    queryKey: ["/api/public/recipes", category === "all" ? undefined : category],
    queryFn: async () => {
      const url = category === "all" 
        ? "/api/public/recipes" 
        : `/api/public/recipes?category=${encodeURIComponent(category)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch recipes");
      return res.json();
    },
  });

  const filteredRecipes = recipes
    .filter((recipe) => recipe.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  const categoryTitle = categoryLabels[category.toLowerCase()] || "Recipes";

  return (
    <>
      <SEO 
        title={`${categoryTitle} - Browse Community Recipes`}
        description={`Discover ${categoryTitle.toLowerCase()} recipes shared by the community. Find inspiration for your next meal from fellow home cooks.`}
      />
      <main className="pt-20 sm:pt-28 pb-12 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-foreground" data-testid="text-page-title">
              Community Recipes
            </h1>
          </div>

          {/* Horizontal Scrolling Category Chips */}
          <div className="relative mb-4">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <Button
                variant={category === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => navigate("/recipes")}
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
                  onClick={() => navigate(`/recipes/${cat.toLowerCase()}`)}
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
                data-testid="input-search-public"
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
              {[...Array(6)].map((_, i) => (
                <RecipeCardSkeleton key={i} viewMode={viewMode} />
              ))}
            </div>
          ) : (
            <>

              {filteredRecipes.length === 0 ? (
                <div className="text-center py-16">
                  <ChefHat className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground" data-testid="text-no-public-recipes">
                    {searchQuery 
                      ? "No recipes match your search"
                      : "No public recipes in this category yet"
                    }
                  </p>
                  <p className="text-muted-foreground/70 text-sm mt-2">
                    Be the first to share a recipe!
                  </p>
                </div>
              ) : (
                <div className={`animate-stagger ${viewMode === "grid" 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
                  : "grid grid-cols-1 md:grid-cols-2 gap-4"
                }`}>
                  {filteredRecipes.map((recipe) => (
                    <RecipeCard 
                      key={recipe.id} 
                      recipe={recipe} 
                      viewMode={viewMode}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Floating Action Button for Add Recipe - Only show if logged in */}
        {user && (
          <Link href="/add-recipe">
            <Button
              size="lg"
              className="fixed bottom-6 right-6 rounded-full w-14 h-14 z-40 border border-border"
              aria-label="Add new recipe"
              data-testid="button-fab-add-recipe"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </Link>
        )}
      </main>
    </>
  );
}
