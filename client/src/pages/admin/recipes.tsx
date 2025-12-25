import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminDataGrid, Column, FilterOption } from "@/components/admin-data-grid";
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
  const { data: recipes = [], isLoading } = useQuery<AdminRecipe[]>({
    queryKey: ["/api/admin/recipes"],
  });

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const columns: Column<AdminRecipe>[] = [
    {
      key: "name",
      header: "Recipe Name",
      sortable: true,
      render: (recipe) => <span className="font-medium">{recipe.name}</span>,
    },
    {
      key: "category",
      header: "Category",
      sortable: true,
      render: (recipe) => <Badge variant="outline">{recipe.category}</Badge>,
    },
    {
      key: "familyName",
      header: "Family",
      sortable: true,
      render: (recipe) => (
        <span className="text-muted-foreground">{recipe.familyName || "—"}</span>
      ),
    },
    {
      key: "creatorName",
      header: "Creator",
      sortable: true,
      render: (recipe) => (
        <span className="text-muted-foreground">{recipe.creatorName || "Unknown"}</span>
      ),
    },
    {
      key: "isPublic",
      header: "Visibility",
      sortable: true,
      render: (recipe) =>
        recipe.isPublic ? (
          <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
            <Globe className="h-3 w-3" />
            <span className="text-xs">Public</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-muted-foreground">
            <Lock className="h-3 w-3" />
            <span className="text-xs">Private</span>
          </div>
        ),
    },
    {
      key: "viewCount",
      header: "Views",
      sortable: true,
      className: "text-right",
      render: (recipe) => (
        <div className="flex items-center justify-end gap-1 text-muted-foreground">
          <Eye className="h-3 w-3" />
          {recipe.viewCount}
        </div>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      sortable: true,
      render: (recipe) => (
        <span className="text-muted-foreground">
          {format(new Date(recipe.createdAt), "MMM d, yyyy")}
        </span>
      ),
    },
  ];

  const filters: FilterOption[] = [
    {
      key: "isPublic",
      label: "Visibility",
      options: [
        { value: "true", label: "Public" },
        { value: "false", label: "Private" },
      ],
    },
    {
      key: "category",
      label: "Category",
      options: [
        { value: "Breakfast", label: "Breakfast" },
        { value: "Lunch", label: "Lunch" },
        { value: "Dinner", label: "Dinner" },
        { value: "Dessert", label: "Dessert" },
        { value: "Appetizer", label: "Appetizer" },
        { value: "Snack", label: "Snack" },
        { value: "Beverage", label: "Beverage" },
        { value: "Other", label: "Other" },
      ],
    },
  ];

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold" data-testid="text-admin-recipes-title">Recipes</h1>
          <p className="text-muted-foreground">Browse all recipes on the platform</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">All Recipes ({recipes.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <AdminDataGrid
              data={recipes}
              columns={columns}
              filters={filters}
              isLoading={isLoading}
              searchPlaceholder="Search recipes..."
              searchKeys={["name", "category", "familyName", "creatorName"]}
              selectable={true}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              getRowId={(recipe) => recipe.id}
              emptyMessage="No recipes found"
              pageSize={10}
            />
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
