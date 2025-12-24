import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
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
        <Card className="hover-elevate active-elevate-2 cursor-pointer transition-all duration-200" data-testid={`card-recipe-${recipe.id}`}>
          <CardContent className="p-4 flex gap-4">
            <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
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
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-lg truncate" data-testid={`text-recipe-name-${recipe.id}`}>
                {recipe.name}
              </h3>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <Badge variant="secondary" className="text-xs" data-testid={`badge-category-${recipe.id}`}>
                  {recipe.category}
                </Badge>
                {totalTime > 0 && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{totalTime} min</span>
                  </div>
                )}
              </div>
              {recipe.creatorFirstName && (
                <p className="text-xs text-muted-foreground mt-2">
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
      <Card className="overflow-hidden hover-elevate active-elevate-2 cursor-pointer transition-all duration-200" data-testid={`card-recipe-${recipe.id}`}>
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
          <h3 className="font-medium truncate mb-2" data-testid={`text-recipe-name-${recipe.id}`}>
            {recipe.name}
          </h3>
          <div className="flex items-center justify-between gap-2">
            <Badge variant="secondary" className="text-xs" data-testid={`badge-category-${recipe.id}`}>
              {recipe.category}
            </Badge>
            {totalTime > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{totalTime} min</span>
              </div>
            )}
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
        <CardContent className="p-4 flex gap-4">
          <Skeleton className="w-24 h-24 rounded-lg flex-shrink-0" />
          <div className="flex-1">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-5 w-20 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-[4/3]" />
      <CardContent className="p-4">
        <Skeleton className="h-5 w-3/4 mb-2" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
      </CardContent>
    </Card>
  );
}
