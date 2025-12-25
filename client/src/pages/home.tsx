import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { RecipeCard, RecipeCardSkeleton } from "@/components/recipe-card";
import { useAuth } from "@/hooks/use-auth";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LayoutGrid, List, Search, Plus } from "lucide-react";
import { Link } from "wouter";
import type { RecipeWithCreator, Family, RecipeCategory } from "@shared/schema";
import { recipeCategories } from "@shared/schema";

type RecipeFilter = "all" | "my-recipes" | "saved";

const filterLabels: Record<RecipeFilter, string> = {
  "all": "All",
  "my-recipes": "My Recipes",
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
      case "my-recipes":
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
      navigate("/my-recipes");
    } else {
      navigate(`/my-recipes/${cat.toLowerCase()}`);
    }
  };

  return (
    <main className="pt-20 sm:pt-28 pb-12 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-foreground" data-testid="text-page-title">
              My Recipes
            </h1>
            <p className="text-muted-foreground mt-1">
              Your personal recipe collection
            </p>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            <Button
              variant={category === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => handleCategoryChange("all")}
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
                data-testid={`button-category-${cat.toLowerCase()}`}
              >
                {cat}
              </Button>
            ))}
          </div>

          {isLoading ? (
            <>
              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <div className="flex-1 h-10 bg-muted rounded-lg animate-pulse" />
                <div className="flex gap-2">
                  <div className="w-20 h-10 bg-muted rounded-lg animate-pulse" />
                  <div className="w-24 h-10 bg-muted rounded-lg animate-pulse" />
                  <div className="w-28 h-10 bg-muted rounded-lg animate-pulse" />
                </div>
              </div>
              <div className={viewMode === "grid" 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
                : "flex flex-col gap-4"
              }>
                {[...Array(8)].map((_, i) => (
                  <RecipeCardSkeleton key={i} viewMode={viewMode} />
                ))}
              </div>
            </>
          ) : familyRecipes.length === 0 && savedRecipes.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <div className="flex flex-col sm:flex-row gap-3 mb-8">
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
                <div className="flex gap-2">
                  <div className="flex border border-border rounded-lg overflow-hidden">
                    <Button
                      variant={viewMode === "grid" ? "secondary" : "ghost"}
                      size="icon"
                      className="rounded-none"
                      onClick={() => setViewMode("grid")}
                      data-testid="button-grid-view"
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "secondary" : "ghost"}
                      size="icon"
                      className="rounded-none"
                      onClick={() => setViewMode("list")}
                      data-testid="button-list-view"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                  <Select 
                    value={recipeFilter} 
                    onValueChange={(v) => setRecipeFilter(v as RecipeFilter)}
                  >
                    <SelectTrigger className="w-28" data-testid="select-recipe-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="my-recipes">My Recipes</SelectItem>
                      <SelectItem value="saved">Saved</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button asChild className="gap-2" data-testid="button-add-recipe">
                    <Link href="/add-recipe">
                      <Plus className="h-4 w-4" />
                      <span className="hidden sm:inline">Add Recipe</span>
                    </Link>
                  </Button>
                </div>
              </div>

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
  );
}
