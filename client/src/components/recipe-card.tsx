import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users } from "lucide-react";
import type { RecipeWithCreator } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

interface RecipeCardProps {
  recipe: RecipeWithCreator;
  viewMode: "grid" | "list";
  showCreator?: boolean;
}

export function RecipeCard({ recipe, viewMode, showCreator = false }: RecipeCardProps) {
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);

  if (viewMode === "list") {
    return (
      <Link href={`/recipe/${recipe.id}`}>
        <Card 
          className="group cursor-pointer border border-border"
          data-testid={`card-recipe-${recipe.id}`}
        >
          <CardContent className="p-4 flex gap-4">
            <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
              {recipe.imageUrl ? (
                <img
                  src={recipe.imageUrl}
                  alt={recipe.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                  No Image
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 py-1">
              <h3 className="font-semibold text-base truncate mb-2" data-testid={`text-recipe-name-${recipe.id}`}>
                {recipe.name}
              </h3>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <Badge variant="secondary" className="text-xs" data-testid={`badge-category-${recipe.id}`}>
                  {recipe.category}
                </Badge>
                {totalTime > 0 && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span className="font-data">{totalTime} min</span>
                  </div>
                )}
                {recipe.servings && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    <span className="font-data">{recipe.servings}</span>
                  </div>
                )}
              </div>
              {recipe.creatorFirstName && (
                <p className="text-xs text-muted-foreground">
                  by {recipe.creatorFirstName} {recipe.creatorLastName}
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
        className="group overflow-hidden cursor-pointer border border-border"
        data-testid={`card-recipe-${recipe.id}`}
      >
        <div className="aspect-[4/3] bg-muted overflow-hidden">
          {recipe.imageUrl ? (
            <img
              src={recipe.imageUrl}
              alt={recipe.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              No Image
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold truncate mb-2" data-testid={`text-recipe-name-${recipe.id}`}>
            {recipe.name}
          </h3>
          <div className="flex items-center justify-between gap-3 mb-2">
            <Badge variant="secondary" className="text-xs" data-testid={`badge-category-${recipe.id}`}>
              {recipe.category}
            </Badge>
            <div className="flex items-center gap-3 text-muted-foreground">
              {recipe.servings && (
                <div className="flex items-center gap-1 text-xs">
                  <Users className="h-3 w-3" />
                  <span className="font-data">{recipe.servings}</span>
                </div>
              )}
              {totalTime > 0 && (
                <div className="flex items-center gap-1 text-xs">
                  <Clock className="h-3 w-3" />
                  <span className="font-data">{totalTime}m</span>
                </div>
              )}
            </div>
          </div>
          {showCreator && recipe.creatorFirstName && (
            <p className="text-xs text-muted-foreground">
              by {recipe.creatorFirstName} {recipe.creatorLastName}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

export function RecipeCardSkeleton({ viewMode }: { viewMode: "grid" | "list" }) {
  if (viewMode === "list") {
    return (
      <Card className="border border-border">
        <CardContent className="p-4 flex gap-4">
          <Skeleton className="w-24 h-24 rounded-lg flex-shrink-0" />
          <div className="flex-1 py-1">
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-3 w-28" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border border-border">
      <Skeleton className="aspect-[4/3]" />
      <CardContent className="p-4">
        <Skeleton className="h-5 w-3/4 mb-2" />
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-14" />
        </div>
      </CardContent>
    </Card>
  );
}
