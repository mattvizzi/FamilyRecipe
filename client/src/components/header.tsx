import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LogOut, Users, ChefHat, Search, ChevronDown, X, Loader2, Globe } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import type { Family, RecipeWithCreator } from "@shared/schema";
import { recipeCategories } from "@shared/schema";

interface HeaderProps {
  family?: Family | null;
}

export function Header({ family }: HeaderProps) {
  const { user, logout, isLoggingOut } = useAuth();
  const [location, navigate] = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Focus input when modal opens
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [searchOpen]);

  // Clear search when modal closes
  useEffect(() => {
    if (!searchOpen) {
      setSearchQuery("");
      setDebouncedQuery("");
    }
  }, [searchOpen]);

  // Search query
  const { data: searchResults, isLoading: isSearching } = useQuery<RecipeWithCreator[]>({
    queryKey: ['/api/recipes/search', { q: debouncedQuery, limit: 20 }],
    enabled: searchOpen && debouncedQuery.length >= 2,
  });

  const getInitials = () => {
    if (!user) return "?";
    const first = user.firstName?.[0] || "";
    const last = user.lastName?.[0] || "";
    return (first + last).toUpperCase() || user.email?.[0]?.toUpperCase() || "?";
  };

  const isMyRecipes = location === "/my-recipes" || location === "/";
  const isBrowsing = location?.startsWith("/recipes") ?? false;

  const handleRecipeClick = (recipeId: string) => {
    setSearchOpen(false);
    navigate(`/recipe/${recipeId}`);
  };

  const handleSeeMore = () => {
    setSearchOpen(false);
    navigate(`/recipes?q=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <>
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
                    Categories
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
                  My Family Recipes
                </Button>
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex items-center gap-2 text-muted-foreground w-48 justify-start"
              onClick={() => setSearchOpen(true)}
              data-testid="button-search"
            >
              <Search className="h-4 w-4" />
              <span>Search recipes...</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden"
              onClick={() => setSearchOpen(true)}
              data-testid="button-search-mobile"
            >
              <Search className="h-4 w-4" />
            </Button>

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

      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="sm:max-w-lg p-0 gap-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="sr-only">Search Recipes</DialogTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search recipes by name..."
                className="pl-10 pr-10"
                data-testid="input-search"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setSearchQuery("")}
                  data-testid="button-clear-search"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </DialogHeader>

          <div className="max-h-[400px] overflow-y-auto">
            {searchQuery.length < 2 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">
                Type at least 2 characters to search
              </div>
            ) : isSearching ? (
              <div className="p-6 flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : searchResults && searchResults.length > 0 ? (
              <div className="p-2">
                {searchResults.map((recipe) => (
                  <button
                    key={recipe.id}
                    onClick={() => handleRecipeClick(recipe.id)}
                    className="w-full text-left p-3 rounded-md hover-elevate flex items-center gap-3"
                    data-testid={`search-result-${recipe.id}`}
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
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="text-xs">
                          {recipe.category}
                        </Badge>
                        {recipe.isPublic && (
                          <Globe className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </button>
                ))}
                {searchResults.length >= 20 && (
                  <div className="p-2 border-t border-border mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={handleSeeMore}
                      data-testid="button-see-more-results"
                    >
                      See more results
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center text-muted-foreground text-sm">
                No recipes found for "{searchQuery}"
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
