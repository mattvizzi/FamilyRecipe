import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import type { Family } from "@shared/schema";

import Landing from "@/pages/landing";
import Home from "@/pages/home";
import RecipeDetail from "@/pages/recipe-detail";
import AddRecipe from "@/pages/add-recipe";
import ManualRecipe from "@/pages/manual-recipe";
import FamilySettings from "@/pages/family-settings";
import FamilyOnboarding from "@/pages/family-onboarding";
import JoinFamily from "@/pages/join-family";
import NotFound from "@/pages/not-found";

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
      <Switch>
        <Route path="/join/:code" component={JoinFamily} />
        <Route component={FamilyOnboarding} />
      </Switch>
    );
  }

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/recipe/:id" component={RecipeDetail} />
      <Route path="/add-recipe" component={AddRecipe} />
      <Route path="/add-recipe/manual" component={ManualRecipe} />
      <Route path="/family" component={FamilySettings} />
      <Route path="/join/:code" component={JoinFamily} />
      <Route component={NotFound} />
    </Switch>
  );
}

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <Switch>
        <Route path="/join/:code" component={JoinFamily} />
        <Route component={Landing} />
      </Switch>
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
