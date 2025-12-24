import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users } from "lucide-react";
import type { RecipeWithCreator } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

interface RecipeCardProps {
  recipe: RecipeWithCreator;
  viewMode: "grid" | "list";
}

export function RecipeCard({ recipe, viewMode }: RecipeCardProps) {
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);

  if (viewMode === "list") {
    return (
      <Link href={`/recipe/${recipe.id}`}>
        <Card 
          className="group hover-elevate active-elevate-2 cursor-pointer transition-all duration-300"
          data-testid={`card-recipe-${recipe.id}`}
        >
          <CardContent className="p-5 flex gap-5">
            <div className="w-28 h-28 flex-shrink-0 rounded-xl overflow-hidden bg-muted">
              {recipe.imageUrl ? (
                <img
                  src={recipe.imageUrl}
                  alt={recipe.name}
                  className="w-full h-full object-cover img-zoom"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                  No Image
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 py-1">
              <h3 className="headline text-lg truncate mb-2" data-testid={`text-recipe-name-${recipe.id}`}>
                {recipe.name}
              </h3>
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <Badge variant="secondary" className="text-xs" data-testid={`badge-category-${recipe.id}`}>
                  {recipe.category}
                </Badge>
                {totalTime > 0 && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{totalTime} min</span>
                  </div>
                )}
                {recipe.servings && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    <span>{recipe.servings} servings</span>
                  </div>
                )}
              </div>
              {recipe.creatorFirstName && (
                <p className="label-meta">
                  Added by {recipe.creatorFirstName} {recipe.creatorLastName}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Link href={`/recipe/${recipe.id}`}>
      <Card 
        className="group overflow-hidden hover-elevate active-elevate-2 cursor-pointer transition-all duration-300"
        data-testid={`card-recipe-${recipe.id}`}
      >
        <div className="aspect-[4/3] bg-muted overflow-hidden relative">
          {recipe.imageUrl ? (
            <img
              src={recipe.imageUrl}
              alt={recipe.name}
              className="w-full h-full object-cover img-zoom"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              No Image
            </div>
          )}
          <div className="gradient-overlay opacity-60" />
        </div>
        <CardContent className="p-5">
          <h3 className="headline truncate mb-3" data-testid={`text-recipe-name-${recipe.id}`}>
            {recipe.name}
          </h3>
          <div className="flex items-center justify-between gap-3">
            <Badge variant="secondary" className="text-xs" data-testid={`badge-category-${recipe.id}`}>
              {recipe.category}
            </Badge>
            <div className="flex items-center gap-3">
              {recipe.servings && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  <span>{recipe.servings}</span>
                </div>
              )}
              {totalTime > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{totalTime}m</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function RecipeCardSkeleton({ viewMode }: { viewMode: "grid" | "list" }) {
  if (viewMode === "list") {
    return (
      <Card>
        <CardContent className="p-5 flex gap-5">
          <Skeleton className="w-28 h-28 rounded-xl flex-shrink-0" />
          <div className="flex-1 py-1">
            <Skeleton className="h-6 w-3/4 mb-3" />
            <Skeleton className="h-5 w-24 mb-3" />
            <Skeleton className="h-4 w-32" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-[4/3]" />
      <CardContent className="p-5">
        <Skeleton className="h-5 w-3/4 mb-3" />
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}
