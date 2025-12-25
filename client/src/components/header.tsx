import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { LogOut, Users, ChefHat, Search, Globe, Plus, Settings, BookOpen, Loader2, TrendingUp, Menu, Sun, Moon, Shield } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useAdmin } from "@/features/admin/use-admin";
import { NotificationBell } from "@/components/notification-bell";
import { useQuery } from "@tanstack/react-query";
import type { Family, RecipeWithCreator } from "@shared/schema";
import { recipeCategories } from "@shared/schema";
import { useTheme } from "@/components/theme-provider";

interface HeaderProps {
  family?: Family | null;
}

export function Header({ family }: HeaderProps) {
  const { user, logout, isLoggingOut } = useAuth();
  const { isAdmin } = useAdmin();
  const [location, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  // Keyboard shortcut to open command palette
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Clear search when closing
  useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

  // Search query - only fetch when there's a search term
  const { data: searchResults, isLoading: isSearching } = useQuery<RecipeWithCreator[]>({
    queryKey: ['/api/recipes/search', { q: search, limit: 10 }],
    enabled: open && search.length >= 2,
  });

  const getInitials = () => {
    if (!user) return "?";
    const first = user.firstName?.[0] || "";
    const last = user.lastName?.[0] || "";
    return (first + last).toUpperCase() || user.email?.[0]?.toUpperCase() || "?";
  };

  const isBrowsing = location?.startsWith("/recipes") ?? false;
  const currentCategory = isBrowsing ? location.split("/recipes/")[1] : null;

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <>
      {/* Main Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border h-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-4 relative">
          {/* Logo - Left aligned */}
          <div className="z-10">
            <Link href="/home">
              <div className="flex items-center cursor-pointer" data-testid="link-home">
                <span className="text-2xl font-bold tracking-tight text-primary">Family</span>
                <span className="text-2xl font-light text-foreground tracking-tight">Recipe</span>
              </div>
            </Link>
          </div>

          {/* Desktop: Search - Absolutely centered */}
          <div className="hidden sm:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 text-muted-foreground w-64 justify-between border border-black dark:border-white"
              onClick={() => setOpen(true)}
              data-testid="button-search"
            >
              <span className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Search...
              </span>
              <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2 z-10">
            {/* Mobile search - keep since it's not in bottom nav */}
            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden"
              onClick={() => setOpen(true)}
              aria-label="Search recipes"
              data-testid="button-search-mobile"
            >
              <Search className="h-4 w-4" />
            </Button>

            {/* Family Recipes link - hidden on mobile, shown on desktop */}
            {family && (
              <Link href="/family-recipes" className="hidden sm:block" data-testid="link-family-recipes-nav">
                <span className="text-sm text-foreground hover:underline cursor-pointer">
                  {family.name}
                </span>
              </Link>
            )}

            {/* Notifications - hidden on mobile, shown on desktop */}
            <div className="hidden sm:block">
              <NotificationBell />
            </div>

            {/* Profile menu - hidden on mobile, shown on desktop */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-lg hidden sm:flex" aria-label="User menu" data-testid="button-user-menu">
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
                <DropdownMenuItem 
                  onClick={toggleTheme}
                  className="cursor-pointer"
                  data-testid="dropdown-theme-toggle"
                >
                  {theme === "dark" ? (
                    <Sun className="h-4 w-4 mr-2" />
                  ) : (
                    <Moon className="h-4 w-4 mr-2" />
                  )}
                  {theme === "dark" ? "Light Mode" : "Dark Mode"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/settings" className="flex items-center gap-2" data-testid="link-settings">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/dashboard" className="flex items-center gap-2" data-testid="dropdown-go-to-admin">
                      <Shield className="h-4 w-4" />
                      Go to Admin
                    </Link>
                  </DropdownMenuItem>
                )}
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

      {/* Desktop Sub-navigation bar with categories */}
      <nav className="fixed top-14 left-0 right-0 z-40 bg-primary hidden sm:block shadow-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-4 h-10 overflow-x-auto scrollbar-hide">
            <Link href="/recipes">
              <span 
                className={`text-sm text-primary-foreground cursor-pointer hover:underline ${location === "/recipes" ? "font-bold underline" : ""}`}
                data-testid="subnav-all-recipes"
              >
                All Recipes
              </span>
            </Link>
            {recipeCategories.map((cat) => (
              <Link key={cat} href={`/recipes/${cat.toLowerCase()}`}>
                <span 
                  className={`text-sm text-primary-foreground cursor-pointer hover:underline whitespace-nowrap ${currentCategory === cat.toLowerCase() ? "font-bold underline" : ""}`}
                  data-testid={`subnav-category-${cat.toLowerCase()}`}
                >
                  {cat}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Search recipes or type a command..." 
          value={search}
          onValueChange={setSearch}
          data-testid="input-command-search"
        />
        <CommandList>
          {search.length >= 2 && (
            <>
              {isSearching ? (
                <div className="py-6 text-center">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                </div>
              ) : searchResults && searchResults.length > 0 ? (
                <CommandGroup heading="Recipes">
                  {searchResults.map((recipe) => (
                    <CommandItem
                      key={recipe.id}
                      value={recipe.name}
                      onSelect={() => runCommand(() => navigate(`/recipe/${recipe.id}`))}
                      className="flex items-center gap-3"
                      data-testid={`search-result-${recipe.id}`}
                    >
                      {recipe.imageUrl ? (
                        <img
                          src={recipe.imageUrl}
                          alt=""
                          className="w-8 h-8 rounded object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded bg-muted flex items-center justify-center flex-shrink-0">
                          <ChefHat className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="truncate">{recipe.name}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs ml-2">
                        {recipe.category}
                      </Badge>
                      {recipe.isPublic && (
                        <Globe className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : (
                <CommandEmpty>No recipes found.</CommandEmpty>
              )}
              <CommandSeparator />
            </>
          )}

          <CommandGroup heading="Quick Actions">
            <CommandItem
              onSelect={() => runCommand(() => navigate("/add-recipe"))}
              data-testid="command-add-recipe"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add New Recipe
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => navigate("/family-recipes"))}
              data-testid="command-family-recipes"
            >
              <ChefHat className="mr-2 h-4 w-4" />
              Family Recipes
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => navigate("/recipes"))}
              data-testid="command-browse"
            >
              <Globe className="mr-2 h-4 w-4" />
              All Recipes
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => navigate("/home"))}
              data-testid="command-home"
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Dashboard
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Categories">
            {recipeCategories.map((cat) => (
              <CommandItem
                key={cat}
                onSelect={() => runCommand(() => navigate(`/recipes/${cat.toLowerCase()}`))}
                data-testid={`command-category-${cat.toLowerCase()}`}
              >
                <BookOpen className="mr-2 h-4 w-4" />
                {cat}
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Settings">
            <CommandItem
              onSelect={() => runCommand(() => navigate("/settings"))}
              data-testid="command-settings"
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-72">
          <SheetHeader className="text-left mb-6">
            <SheetTitle className="flex items-center">
              <span className="text-xl font-bold tracking-tight text-primary">Family</span>
              <span className="text-xl font-light text-foreground tracking-tight">Recipe</span>
            </SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-1">
            {/* Primary: View Recipes */}
            <SheetClose asChild>
              <Link href="/family-recipes">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-3"
                  data-testid="mobile-nav-family-recipes"
                >
                  <ChefHat className="h-4 w-4" />
                  Family Recipes
                </Button>
              </Link>
            </SheetClose>
            <SheetClose asChild>
              <Link href="/recipes">
                <Button 
                  variant="ghost" 
                  className={`w-full justify-start gap-3 ${isBrowsing ? "bg-accent" : ""}`}
                  data-testid="mobile-nav-browse"
                >
                  <Globe className="h-4 w-4" />
                  All Recipes
                </Button>
              </Link>
            </SheetClose>
            
            <div className="my-3 border-t border-border" />

            {/* Secondary: Actions */}
            <SheetClose asChild>
              <Link href="/add-recipe">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-3"
                  data-testid="mobile-nav-add"
                >
                  <Plus className="h-4 w-4" />
                  Add Recipe
                </Button>
              </Link>
            </SheetClose>
            <SheetClose asChild>
              <Link href="/home">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-3"
                  data-testid="mobile-nav-home"
                >
                  <TrendingUp className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
            </SheetClose>
            
            <div className="my-3 border-t border-border" />
            
            {/* Categories */}
            <p className="px-3 text-xs font-medium text-muted-foreground mb-2">Categories</p>
            {recipeCategories.map((cat) => (
              <SheetClose key={cat} asChild>
                <Link href={`/recipes/${cat.toLowerCase()}`}>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="w-full justify-start text-muted-foreground"
                    data-testid={`mobile-nav-category-${cat.toLowerCase()}`}
                  >
                    {cat}
                  </Button>
                </Link>
              </SheetClose>
            ))}
            
            <div className="my-3 border-t border-border" />

            {/* Settings */}
            <SheetClose asChild>
              <Link href="/settings">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-3"
                  data-testid="mobile-nav-settings"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
              </Link>
            </SheetClose>
            
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-3"
              onClick={toggleTheme}
              data-testid="mobile-nav-theme-toggle"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </Button>
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
