import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Home, ChefHat, Globe, TrendingUp } from "lucide-react";

interface AdminStats {
  totalUsers: number;
  totalFamilies: number;
  totalRecipes: number;
  publicRecipes: number;
  recentUsers: number;
  recentRecipes: number;
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold" data-testid="text-admin-dashboard-title">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your Recipe Tracker platform</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold" data-testid="stat-total-users">{stats?.totalUsers ?? 0}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-green-600 dark:text-green-400">+{stats?.recentUsers ?? 0}</span> in last 7 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Families</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold" data-testid="stat-total-families">{stats?.totalFamilies ?? 0}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">Active family groups</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Recipes</CardTitle>
              <ChefHat className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold" data-testid="stat-total-recipes">{stats?.totalRecipes ?? 0}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-green-600 dark:text-green-400">+{stats?.recentRecipes ?? 0}</span> in last 7 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Public Recipes</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold" data-testid="stat-public-recipes">{stats?.publicRecipes ?? 0}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {stats && stats.totalRecipes > 0 
                  ? `${Math.round((stats.publicRecipes / stats.totalRecipes) * 100)}% of total`
                  : "0% of total"
                }
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Recipes/Family</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold" data-testid="stat-avg-recipes">
                  {stats && stats.totalFamilies > 0 
                    ? (stats.totalRecipes / stats.totalFamilies).toFixed(1)
                    : "0"
                  }
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">Recipes per family group</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
