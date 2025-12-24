import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { RecipeCard, RecipeCardSkeleton } from "@/components/recipe-card";
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
import { LayoutGrid, List, Search } from "lucide-react";
import type { RecipeWithCreator, Family, RecipeCategory } from "@shared/schema";
import { recipeCategories } from "@shared/schema";

export default function Home() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<RecipeCategory | "all">("all");

  const { data: family, isLoading: familyLoading } = useQuery<Family>({
    queryKey: ["/api/family"],
  });

  const { data: recipes = [], isLoading: recipesLoading } = useQuery<RecipeWithCreator[]>({
    queryKey: ["/api/recipes"],
    enabled: !!family,
  });

  const isLoading = familyLoading || recipesLoading;

  // Filter and sort recipes
  const filteredRecipes = recipes
    .filter((recipe) => {
      const matchesSearch = recipe.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "all" || recipe.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="min-h-screen bg-background">
      <Header family={family} />
      
      <main className="pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <div className="flex-1 h-10 bg-muted rounded-lg animate-pulse" />
                <div className="flex gap-2">
                  <div className="w-40 h-10 bg-muted rounded-lg animate-pulse" />
                  <div className="w-20 h-10 bg-muted rounded-lg animate-pulse" />
                </div>
              </div>
              <div className={viewMode === "grid" 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "flex flex-col gap-4"
              }>
                {[...Array(8)].map((_, i) => (
                  <RecipeCardSkeleton key={i} viewMode={viewMode} />
                ))}
              </div>
            </>
          ) : recipes.length === 0 ? (
            <EmptyState familyName={family?.name || "Your Family"} />
          ) : (
            <>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
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
                  <Select 
                    value={categoryFilter} 
                    onValueChange={(v) => setCategoryFilter(v as RecipeCategory | "all")}
                  >
                    <SelectTrigger className="w-40" data-testid="select-category-filter">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {recipeCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex border rounded-lg">
                    <Button
                      variant={viewMode === "grid" ? "secondary" : "ghost"}
                      size="icon"
                      onClick={() => setViewMode("grid")}
                      data-testid="button-grid-view"
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "secondary" : "ghost"}
                      size="icon"
                      onClick={() => setViewMode("list")}
                      data-testid="button-list-view"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {filteredRecipes.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-muted-foreground" data-testid="text-no-results">
                    No recipes match your search
                  </p>
                </div>
              ) : (
                <div className={viewMode === "grid" 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "flex flex-col gap-4"
                }>
                  {filteredRecipes.map((recipe) => (
                    <RecipeCard key={recipe.id} recipe={recipe} viewMode={viewMode} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
