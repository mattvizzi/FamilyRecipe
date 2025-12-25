import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, ChefHat, BookOpen, TrendingUp, Clock, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { RecipeWithCreator, FamilyWithMembers } from "@shared/schema";

export default function Dashboard() {
  const { data: recipes, isLoading: recipesLoading } = useQuery<RecipeWithCreator[]>({
    queryKey: ["/api/recipes"],
  });

  const { data: family, isLoading: familyLoading } = useQuery<FamilyWithMembers>({
    queryKey: ["/api/family/details"],
  });

  const recentRecipes = recipes?.slice(0, 4) || [];
  const isLoading = recipesLoading || familyLoading;

  return (
    <main className="pt-20 pb-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2" data-testid="text-welcome">
            Welcome back
          </h1>
          <p className="text-muted-foreground">
            {family?.name || "Your family recipes"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card data-testid="card-quick-stats-recipes">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <ChefHat className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-data">
                    {isLoading ? <Skeleton className="h-8 w-12" /> : recipes?.length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Recipes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-quick-stats-members">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-accent/50">
                  <Users className="h-6 w-6 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-data">
                    {isLoading ? <Skeleton className="h-8 w-12" /> : family?.members?.length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Family Members</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-quick-stats-activity">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-muted">
                  <TrendingUp className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-data">
                    {isLoading ? <Skeleton className="h-8 w-12" /> : "--"}
                  </p>
                  <p className="text-sm text-muted-foreground">This Week</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
                <CardTitle className="text-lg">Recent Recipes</CardTitle>
                <Link href="/my-recipes">
                  <Button variant="ghost" size="sm" data-testid="link-view-all-recipes">
                    View All
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : recentRecipes.length > 0 ? (
                  <div className="space-y-2">
                    {recentRecipes.map((recipe) => (
                      <Link key={recipe.id} href={`/recipe/${recipe.id}`}>
                        <div 
                          className="flex items-center gap-3 p-3 rounded-lg hover-elevate cursor-pointer"
                          data-testid={`recent-recipe-${recipe.id}`}
                        >
                          {recipe.imageUrl ? (
                            <img
                              src={recipe.imageUrl}
                              alt=""
                              className="w-12 h-12 rounded-md object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                              <ChefHat className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{recipe.name}</p>
                            <p className="text-sm text-muted-foreground">{recipe.category}</p>
                          </div>
                          {recipe.cookTime && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="h-3.5 w-3.5" />
                              <span className="font-data">{recipe.cookTime}m</span>
                            </div>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ChefHat className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground mb-4">No recipes yet</p>
                    <Link href="/add-recipe">
                      <Button data-testid="button-add-first-recipe">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Recipe
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/add-recipe">
                  <Button variant="outline" className="w-full justify-start" data-testid="quick-action-add">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Recipe
                  </Button>
                </Link>
                <Link href="/recipes">
                  <Button variant="outline" className="w-full justify-start" data-testid="quick-action-browse">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Browse Public Recipes
                  </Button>
                </Link>
                <Link href="/family">
                  <Button variant="outline" className="w-full justify-start" data-testid="quick-action-family">
                    <Users className="h-4 w-4 mr-2" />
                    Family Settings
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Activity Feed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6 text-muted-foreground text-sm">
                  Coming soon
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
