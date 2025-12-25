import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Home, ChefHat, Globe, TrendingUp, Eye } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";

interface AdminStats {
  totalUsers: number;
  totalFamilies: number;
  totalRecipes: number;
  publicRecipes: number;
  recentUsers: number;
  recentRecipes: number;
}

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

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: recipes = [], isLoading: recipesLoading } = useQuery<AdminRecipe[]>({
    queryKey: ["/api/admin/recipes"],
  });

  const categoryCounts = recipes.reduce((acc: Record<string, number>, r) => {
    acc[r.category] = (acc[r.category] || 0) + 1;
    return acc;
  }, {});

  const categoryData = Object.entries(categoryCounts).map(([name, value]) => ({ name, value }));
  
  const topRecipes = [...recipes]
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, 5)
    .map(r => ({
      name: r.name.length > 15 ? r.name.slice(0, 15) + "..." : r.name,
      views: r.viewCount,
    }));

  const isLoading = statsLoading || recipesLoading;

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold" data-testid="text-admin-dashboard-title">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your Recipe Tracker platform</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
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
              {statsLoading ? (
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
              {statsLoading ? (
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
              {statsLoading ? (
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
              {statsLoading ? (
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

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {recipesLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold" data-testid="stat-total-views">
                  {recipes.reduce((sum, r) => sum + r.viewCount, 0).toLocaleString()}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">Across all recipes</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recipes by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[200px] w-full" />
              ) : categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {categoryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  No recipe data available
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Recipes by Views</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[200px] w-full" />
              ) : topRecipes.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={topRecipes} layout="vertical">
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="views" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  No recipe data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
