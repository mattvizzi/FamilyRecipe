import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Users, ChefHat, Search, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import type { Family } from "@shared/schema";
import { recipeCategories } from "@shared/schema";

interface HeaderProps {
  family?: Family | null;
}

export function Header({ family }: HeaderProps) {
  const { user, logout, isLoggingOut } = useAuth();
  const [location] = useLocation();

  const getInitials = () => {
    if (!user) return "?";
    const first = user.firstName?.[0] || "";
    const last = user.lastName?.[0] || "";
    return (first + last).toUpperCase() || user.email?.[0]?.toUpperCase() || "?";
  };

  const isMyRecipes = location === "/my-recipes" || location === "/";
  const isBrowsing = location?.startsWith("/recipes") ?? false;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border h-14">
      <div className="max-w-5xl mx-auto px-6 h-full flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link href="/">
            <div className="flex items-center cursor-pointer" data-testid="link-home">
              <span className="text-xl font-bold tracking-tight text-primary">Family</span>
              <span className="text-xl font-light text-foreground tracking-tight">Recipe</span>
            </div>
          </Link>

          <nav className="hidden sm:flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={isBrowsing ? "bg-accent" : ""}
                  data-testid="nav-browse-dropdown"
                >
                  <Search className="h-4 w-4 mr-1.5" />
                  Browse
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40">
                <DropdownMenuItem asChild>
                  <Link href="/recipes" className="cursor-pointer" data-testid="nav-all-recipes">
                    All Recipes
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {recipeCategories.map((cat) => (
                  <DropdownMenuItem key={cat} asChild>
                    <Link href={`/recipes/${cat.toLowerCase()}`} className="cursor-pointer" data-testid={`nav-category-${cat.toLowerCase()}`}>
                      {cat}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Link href="/my-recipes">
              <Button 
                variant="ghost" 
                size="sm" 
                className={isMyRecipes ? "bg-accent" : ""}
                data-testid="nav-my-recipes"
              >
                <ChefHat className="h-4 w-4 mr-1.5" />
                My Recipes
              </Button>
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-lg" data-testid="button-user-menu">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.profileImageUrl || undefined} alt="Profile" />
                  <AvatarFallback className="text-sm font-medium bg-muted">{getInitials()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 p-1.5">
              <div className="px-2.5 py-2">
                <p className="text-sm font-medium" data-testid="text-user-name">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-muted-foreground truncate" data-testid="text-user-email">
                  {user?.email}
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/family" className="flex items-center gap-2" data-testid="link-family-settings">
                  <Users className="h-4 w-4" />
                  Family Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => logout()}
                disabled={isLoggingOut}
                className="text-destructive focus:text-destructive cursor-pointer"
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {isLoggingOut ? "Signing out..." : "Sign Out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
