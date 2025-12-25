import { Switch, Route, Redirect, useLocation } from "wouter";
import { Suspense, lazy } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { useAuth } from "@/hooks/use-auth";
import { useAdmin } from "@/hooks/use-admin";
import { useQuery } from "@tanstack/react-query";
import type { Family } from "@shared/schema";
import { Header } from "@/components/header";

// Eagerly loaded pages (critical path)
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import NotFound from "@/pages/not-found";

// Lazy loaded pages (code splitting for less frequently used pages)
const Dashboard = lazy(() => import("@/pages/dashboard"));
const PublicRecipes = lazy(() => import("@/pages/public-recipes"));
const RecipeDetail = lazy(() => import("@/pages/recipe-detail"));
const AddRecipe = lazy(() => import("@/pages/add-recipe"));
const ManualRecipe = lazy(() => import("@/pages/manual-recipe"));
const FamilySettings = lazy(() => import("@/pages/family-settings"));
const FamilyOnboarding = lazy(() => import("@/pages/family-onboarding"));
const JoinFamily = lazy(() => import("@/pages/join-family"));

// Admin pages (lazy loaded)
const AdminDashboard = lazy(() => import("@/pages/admin/dashboard"));
const AdminUsers = lazy(() => import("@/pages/admin/users"));
const AdminFamilies = lazy(() => import("@/pages/admin/families"));
const AdminRecipes = lazy(() => import("@/pages/admin/recipes"));
const AdminHubSpot = lazy(() => import("@/pages/admin/hubspot"));

// Loading fallback component
function PageLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );
}

function AdminRouter() {
  const { isAdmin, isLoading } = useAdmin();
  const { user } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!user) {
    return <Redirect to="/" />;
  }

  if (!isAdmin) {
    return <Redirect to="/home" />;
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/users" component={AdminUsers} />
        <Route path="/admin/families" component={AdminFamilies} />
        <Route path="/admin/recipes" component={AdminRecipes} />
        <Route path="/admin/hubspot" component={AdminHubSpot} />
        <Route>{() => <Redirect to="/admin" />}</Route>
      </Switch>
    </Suspense>
  );
}

function AuthenticatedRouter() {
  const { data: family, isLoading: familyLoading } = useQuery<Family>({
    queryKey: ["/api/family"],
  });

  if (familyLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!family) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/create-family" component={FamilyOnboarding} />
          <Route path="/join/:code" component={JoinFamily} />
          <Route>{() => <Redirect to="/create-family" />}</Route>
        </Switch>
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header family={family} />
      <Suspense fallback={
        <div className="pt-20 flex items-center justify-center" style={{ minHeight: 'calc(100vh - 5rem)' }}>
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      }>
        <Switch>
          <Route path="/">{() => <Redirect to="/home" />}</Route>
          <Route path="/home" component={Dashboard} />
          <Route path="/my-recipes" component={Home} />
          <Route path="/my-recipes/:category" component={Home} />
          <Route path="/recipes" component={PublicRecipes} />
          <Route path="/recipes/:category" component={PublicRecipes} />
          <Route path="/recipe/:id" component={RecipeDetail} />
          <Route path="/add-recipe" component={AddRecipe} />
          <Route path="/add-recipe/manual" component={ManualRecipe} />
          <Route path="/family" component={FamilySettings} />
          <Route path="/join/:code" component={JoinFamily} />
          <Route path="/create-family">{() => <Redirect to="/my-recipes" />}</Route>
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </div>
  );
}

function Router() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Admin routes have their own router with admin checks
  if (location?.startsWith("/admin")) {
    if (!user) {
      return <Redirect to="/" />;
    }
    return <AdminRouter />;
  }

  if (!user) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/join/:code" component={JoinFamily} />
          <Route component={Landing} />
        </Switch>
      </Suspense>
    );
  }

  return <AuthenticatedRouter />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
