import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChefHat, Clock, Users, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { RecipeWithCreator } from "@shared/schema";
import { recipeCategories } from "@shared/schema";

function RecipeCarouselSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex-shrink-0 w-64">
          <Skeleton className="aspect-[4/3] rounded-lg mb-2" />
          <Skeleton className="h-5 w-3/4 mb-1" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}

function RecipeCard({ recipe }: { recipe: RecipeWithCreator }) {
  return (
    <Link href={`/recipe/${recipe.id}`}>
      <div 
        className="flex-shrink-0 w-64 group cursor-pointer"
        data-testid={`recipe-card-${recipe.id}`}
      >
        <div className="aspect-[4/3] rounded-lg overflow-hidden bg-muted mb-2 relative">
          {recipe.imageUrl ? (
            <img
              src={recipe.imageUrl}
              alt={recipe.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ChefHat className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          {recipe.cookTime && (
            <div className="absolute bottom-2 left-2 bg-background/90 backdrop-blur-sm rounded px-2 py-1 flex items-center gap-1 text-xs">
              <Clock className="h-3 w-3" />
              <span className="font-data">{recipe.cookTime} min</span>
            </div>
          )}
        </div>
        <h3 className="font-medium truncate group-hover:text-primary transition-colors">
          {recipe.name}
        </h3>
        <p className="text-sm text-muted-foreground">
          {recipe.category}
          {recipe.creatorFirstName && (
            <span> · by {recipe.creatorFirstName}</span>
          )}
        </p>
      </div>
    </Link>
  );
}

function HeroRecipe({ recipe }: { recipe: RecipeWithCreator }) {
  return (
    <Link href={`/recipe/${recipe.id}`}>
      <div 
        className="relative rounded-xl overflow-hidden aspect-[21/9] md:aspect-[3/1] group cursor-pointer"
        data-testid="hero-recipe"
      >
        {recipe.imageUrl ? (
          <img
            src={recipe.imageUrl}
            alt={recipe.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <ChefHat className="h-24 w-24 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <Badge variant="secondary" className="mb-3">
            Featured Recipe
          </Badge>
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">
            {recipe.name}
          </h1>
          <div className="flex items-center gap-4 text-white/80 text-sm">
            {recipe.cookTime && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span className="font-data">{recipe.cookTime} min</span>
              </span>
            )}
            {recipe.servings && (
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span className="font-data">{recipe.servings} servings</span>
              </span>
            )}
            <span>{recipe.category}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function RecipeCarousel({ 
  title, 
  recipes, 
  isLoading,
  viewAllLink 
}: { 
  title: string; 
  recipes: RecipeWithCreator[]; 
  isLoading: boolean;
  viewAllLink?: string;
}) {
  if (isLoading) {
    return (
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">{title}</h2>
        </div>
        <RecipeCarouselSkeleton />
      </section>
    );
  }

  if (recipes.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        {viewAllLink && (
          <Link href={viewAllLink}>
            <Button variant="ghost" size="sm" className="gap-1">
              View All
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 scrollbar-hide">
        {recipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>
    </section>
  );
}

function CategoryGrid() {
  const categoryEmojis: Record<string, string> = {
    Breakfast: "🍳",
    Lunch: "🥗",
    Dinner: "🍝",
    Dessert: "🍰",
    Snack: "🍿",
    Beverage: "🍹",
    Appetizer: "🧀",
    Side: "🥔",
    Soup: "🍲",
    Salad: "🥬",
    Other: "🍽️",
  };

  return (
    <section className="mb-10">
      <h2 className="text-xl font-semibold mb-4">Browse by Category</h2>
      <div className="flex gap-2 overflow-x-auto pb-4 -mx-6 px-6 scrollbar-hide md:mx-0 md:px-0 md:overflow-visible md:justify-between">
        {recipeCategories.map((category) => (
          <Link key={category} href={`/recipes/${category.toLowerCase()}`}>
            <Card 
              className="flex flex-col items-center justify-center text-center hover-elevate cursor-pointer flex-shrink-0 w-20 h-20 md:w-24 md:h-24"
              data-testid={`category-${category.toLowerCase()}`}
            >
              <div className="text-2xl md:text-3xl">{categoryEmojis[category] || "🍽️"}</div>
              <p className="font-medium text-xs mt-1">{category}</p>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function Dashboard() {
  const { data: familyRecipes = [], isLoading: familyLoading } = useQuery<RecipeWithCreator[]>({
    queryKey: ["/api/recipes"],
  });

  const { data: publicRecipes = [], isLoading: publicLoading } = useQuery<RecipeWithCreator[]>({
    queryKey: ["/api/public/recipes"],
  });

  const { data: savedRecipes = [], isLoading: savedLoading } = useQuery<RecipeWithCreator[]>({
    queryKey: ["/api/recipes/saved"],
  });

  const isLoading = familyLoading || publicLoading;

  // Get featured recipe (most viewed or random from family recipes)
  const featuredRecipe = familyRecipes.length > 0 
    ? [...familyRecipes].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))[0]
    : publicRecipes[0];

  // Recent family recipes (excluding featured)
  const recentFamilyRecipes = familyRecipes
    .filter(r => r.id !== featuredRecipe?.id)
    .slice(0, 8);

  // Quick meals (under 30 min cook time)
  const quickMeals = [...familyRecipes, ...publicRecipes]
    .filter(r => r.cookTime && r.cookTime <= 30 && r.id !== featuredRecipe?.id)
    .slice(0, 8);

  // Popular public recipes
  const trendingRecipes = [...publicRecipes]
    .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
    .slice(0, 8);

  // Saved recipes
  const savedRecipesList = savedRecipes.slice(0, 8);

  return (
    <main className="pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-6">
        {isLoading ? (
          <Skeleton className="aspect-[21/9] md:aspect-[3/1] rounded-xl mb-10" />
        ) : featuredRecipe ? (
          <div className="mb-10">
            <HeroRecipe recipe={featuredRecipe} />
          </div>
        ) : (
          <div className="aspect-[21/9] md:aspect-[3/1] rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex flex-col items-center justify-center mb-10">
            <ChefHat className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No recipes yet</h2>
            <p className="text-muted-foreground mb-4">Add your first family recipe to get started</p>
            <Link href="/add-recipe">
              <Button>Add Recipe</Button>
            </Link>
          </div>
        )}

        <RecipeCarousel
          title="From Your Family"
          recipes={recentFamilyRecipes}
          isLoading={familyLoading}
          viewAllLink="/my-recipes"
        />

        {savedRecipesList.length > 0 && (
          <RecipeCarousel
            title="Your Saved Recipes"
            recipes={savedRecipesList}
            isLoading={savedLoading}
          />
        )}

        <RecipeCarousel
          title="Quick Meals (Under 30 min)"
          recipes={quickMeals}
          isLoading={isLoading}
        />

        <CategoryGrid />

        <RecipeCarousel
          title="Trending Public Recipes"
          recipes={trendingRecipes}
          isLoading={publicLoading}
          viewAllLink="/recipes"
        />
      </div>
    </main>
  );
}
