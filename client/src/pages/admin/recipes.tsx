import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Globe, Lock, Eye } from "lucide-react";
import { format } from "date-fns";

interface AdminRecipe {
  id: string;
  name: string;
  category: string;
  isPublic: boolean;
  viewCount: number;
  createdAt: string;
  familyName: string | null;
  creatorName: string | null;
}

export default function AdminRecipes() {
  const { data: recipes, isLoading } = useQuery<AdminRecipe[]>({
    queryKey: ["/api/admin/recipes"],
  });

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold" data-testid="text-admin-recipes-title">Recipes</h1>
          <p className="text-muted-foreground">Browse all recipes on the platform</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">All Recipes ({recipes?.length ?? 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recipe Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Family</TableHead>
                    <TableHead>Creator</TableHead>
                    <TableHead>Visibility</TableHead>
                    <TableHead className="text-right">Views</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recipes?.map((recipe) => (
                    <TableRow key={recipe.id} data-testid={`row-recipe-${recipe.id}`}>
                      <TableCell className="font-medium">{recipe.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{recipe.category}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {recipe.familyName || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {recipe.creatorName || "Unknown"}
                      </TableCell>
                      <TableCell>
                        {recipe.isPublic ? (
                          <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                            <Globe className="h-3 w-3" />
                            <span className="text-xs">Public</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Lock className="h-3 w-3" />
                            <span className="text-xs">Private</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 text-muted-foreground">
                          <Eye className="h-3 w-3" />
                          {recipe.viewCount}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(recipe.createdAt), "MMM d, yyyy")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
