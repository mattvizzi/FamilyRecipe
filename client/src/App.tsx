import { Switch, Route, Redirect, useLocation } from "wouter";
import { Suspense, lazy, useState, useEffect, useMemo } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { useAuth } from "@/hooks/use-auth";
import { useAdmin } from "@/features/admin/use-admin";
import { useQuery } from "@tanstack/react-query";
import type { Family } from "@shared/schema";
import { Header } from "@/components/header";

// Helper to detect if we're on the admin subdomain (memoized for stability)
const ADMIN_DOMAIN = "admin.familyrecipe.app";
const MAIN_DOMAIN = "familyrecipe.app";

// Cache the result at module level to avoid recalculating
let _isAdminSubdomain: boolean | null = null;

function isAdminSubdomain(): boolean {
  if (_isAdminSubdomain !== null) return _isAdminSubdomain;
  if (typeof window === "undefined") return false;
  _isAdminSubdomain = window.location.hostname === ADMIN_DOMAIN;
  return _isAdminSubdomain;
}

function getMainDomainUrl(path: string = "/"): string {
  if (typeof window === "undefined") return path;
  const isProduction = window.location.hostname.includes("familyrecipe.app");
  if (isProduction) {
    return `https://${MAIN_DOMAIN}${path}`;
  }
  return path;
}

// Eagerly loaded pages (critical path)
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import NotFound from "@/pages/not-found";

// Lazy loaded pages (code splitting for less frequently used pages)
const Dashboard = lazy(() => import("@/pages/dashboard"));
const PublicRecipes = lazy(() => import("@/features/recipes/pages/public-recipes"));
const RecipeDetail = lazy(() => import("@/features/recipes/pages/recipe-detail"));
const AddRecipe = lazy(() => import("@/features/recipes/pages/add-recipe"));
const ManualRecipe = lazy(() => import("@/features/recipes/pages/manual-recipe"));
const FamilySettings = lazy(() => import("@/features/family/pages/family-settings"));
const FamilyOnboarding = lazy(() => import("@/features/family/pages/family-onboarding"));
const JoinFamily = lazy(() => import("@/features/family/pages/join-family"));
const UserOnboarding = lazy(() => import("@/features/onboarding/pages/user-onboarding"));

// Admin pages (lazy loaded)
const AdminDashboard = lazy(() => import("@/features/admin/pages/dashboard"));
const AdminUsers = lazy(() => import("@/features/admin/pages/users"));
const AdminFamilies = lazy(() => import("@/features/admin/pages/families"));
const AdminRecipes = lazy(() => import("@/features/admin/pages/recipes"));
const AdminComments = lazy(() => import("@/features/admin/pages/comments"));
const AdminHubSpot = lazy(() => import("@/features/admin/pages/hubspot"));

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
  const { user, isLoading: authLoading } = useAuth();
  const onAdminSubdomain = isAdminSubdomain();
  const [redirected, setRedirected] = useState(false);

  // Handle cross-domain redirects in useEffect to avoid render-time side effects
  useEffect(() => {
    if (authLoading || isLoading || redirected) return;
    
    if (onAdminSubdomain) {
      if (!user) {
        setRedirected(true);
        window.location.href = getMainDomainUrl("/");
      } else if (!isAdmin) {
        setRedirected(true);
        window.location.href = getMainDomainUrl("/home");
      }
    }
  }, [user, isAdmin, authLoading, isLoading, onAdminSubdomain, redirected]);

  // Wait for auth to fully load before making decisions
  if (isLoading || authLoading) {
    return <PageLoader />;
  }

  // If we're about to redirect, show loader
  if (redirected) {
    return <PageLoader />;
  }

  // Redirect unauthorized users
  if (!user) {
    if (onAdminSubdomain) {
      return <PageLoader />; // useEffect will handle redirect
    }
    return <Redirect to="/" />;
  }

  if (!isAdmin) {
    if (onAdminSubdomain) {
      return <PageLoader />; // useEffect will handle redirect
    }
    return <Redirect to="/home" />;
  }

  // Use standardized paths everywhere
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/dashboard" component={AdminDashboard} />
        <Route path="/objects/users" component={AdminUsers} />
        <Route path="/objects/families" component={AdminFamilies} />
        <Route path="/objects/recipes" component={AdminRecipes} />
        <Route path="/objects/comments" component={AdminComments} />
        <Route path="/integrations/hubspot" component={AdminHubSpot} />
        {/* Legacy redirects for old bookmarks */}
        <Route path="/admin/users">{() => <Redirect to="/objects/users" />}</Route>
        <Route path="/admin/families">{() => <Redirect to="/objects/families" />}</Route>
        <Route path="/admin/recipes">{() => <Redirect to="/objects/recipes" />}</Route>
        <Route path="/admin/comments">{() => <Redirect to="/objects/comments" />}</Route>
        <Route path="/admin/hubspot">{() => <Redirect to="/integrations/hubspot" />}</Route>
        <Route path="/admin">{() => <Redirect to="/dashboard" />}</Route>
        <Route>{() => <Redirect to="/dashboard" />}</Route>
      </Switch>
    </Suspense>
  );
}

function SkipToMainContent() {
  return (
    <a 
      href="#main-content" 
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-background focus:text-foreground focus:px-4 focus:py-2 focus:rounded-md focus:border focus:border-border"
    >
      Skip to main content
    </a>
  );
}

interface OnboardingStatus {
  needsOnboarding: boolean;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}

function AuthenticatedRouter() {
  const [location] = useLocation();
  
  const { data: onboardingStatus, isLoading: onboardingLoading } = useQuery<OnboardingStatus>({
    queryKey: ["/api/user/onboarding-status"],
  });
  
  const { data: family, isLoading: familyLoading } = useQuery<Family>({
    queryKey: ["/api/family"],
    enabled: !onboardingStatus?.needsOnboarding,
  });

  if (onboardingLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }
  
  // Check if user needs to complete onboarding (but allow join flow to proceed)
  const isJoinRoute = location?.startsWith("/join/");
  if (onboardingStatus?.needsOnboarding && !isJoinRoute) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/onboarding" component={UserOnboarding} />
          <Route path="/join/:code" component={JoinFamily} />
          <Route>{() => <Redirect to="/onboarding" />}</Route>
        </Switch>
      </Suspense>
    );
  }

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
      <SkipToMainContent />
      <Header family={family} />
      <Suspense fallback={
        <div className="pt-20 flex items-center justify-center" style={{ minHeight: 'calc(100vh - 5rem)' }}>
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      }>
        <div id="main-content">
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
        </div>
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
  // Routes go through AdminRouter for admin subdomain or admin paths
  const onAdminSubdomain = isAdminSubdomain();
  if (onAdminSubdomain || location?.startsWith("/admin") || location?.startsWith("/dashboard") || location?.startsWith("/objects") || location?.startsWith("/integrations")) {
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
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
