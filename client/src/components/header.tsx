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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-4">
          {/* Mobile: Hamburger Left, Logo Center */}
          <div className="flex items-center gap-2 sm:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation menu"
              data-testid="button-mobile-menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          {/* Logo - Centered on mobile, left on desktop */}
          <div className="absolute left-1/2 transform -translate-x-1/2 sm:relative sm:left-0 sm:transform-none">
            <Link href="/home">
              <div className="flex items-center cursor-pointer" data-testid="link-home">
                <span className="text-xl font-bold tracking-tight text-primary">Family</span>
                <span className="text-xl font-light text-foreground tracking-tight">Recipe</span>
              </div>
            </Link>
          </div>

          {/* Desktop: Search */}
          <div className="hidden sm:flex items-center gap-4 flex-1">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 text-muted-foreground w-52 justify-between"
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
          <div className="flex items-center gap-2">
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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-lg" aria-label="User menu" data-testid="button-user-menu">
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
                  <Link href="/add-recipe" className="flex items-center gap-2" data-testid="dropdown-add-recipe">
                    <Plus className="h-4 w-4" />
                    Add a Recipe
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/my-recipes" className="flex items-center gap-2" data-testid="dropdown-my-recipes">
                    <ChefHat className="h-4 w-4" />
                    My Recipes
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/family" className="flex items-center gap-2" data-testid="link-family-settings">
                    <Users className="h-4 w-4" />
                    Family Settings
                  </Link>
                </DropdownMenuItem>
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
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link href="/dashboard" className="flex items-center gap-2" data-testid="dropdown-go-to-admin">
                        <Shield className="h-4 w-4" />
                        Go to Admin
                      </Link>
                    </DropdownMenuItem>
                  </>
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
      <nav className="fixed top-14 left-0 right-0 z-40 bg-primary hidden sm:block">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-1 h-10 overflow-x-auto scrollbar-hide">
            <Link href="/recipes">
              <Button 
                variant="ghost" 
                size="sm"
                className={`text-primary-foreground hover:bg-primary-foreground/10 ${location === "/recipes" ? "bg-primary-foreground/20" : ""}`}
                data-testid="subnav-all-recipes"
              >
                All Recipes
              </Button>
            </Link>
            {recipeCategories.map((cat) => (
              <Link key={cat} href={`/recipes/${cat.toLowerCase()}`}>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className={`text-primary-foreground hover:bg-primary-foreground/10 whitespace-nowrap ${currentCategory === cat.toLowerCase() ? "bg-primary-foreground/20" : ""}`}
                  data-testid={`subnav-category-${cat.toLowerCase()}`}
                >
                  {cat}
                </Button>
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
              onSelect={() => runCommand(() => navigate("/home"))}
              data-testid="command-home"
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Home Dashboard
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => navigate("/my-recipes"))}
              data-testid="command-my-recipes"
            >
              <ChefHat className="mr-2 h-4 w-4" />
              My Family Recipes
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => navigate("/recipes"))}
              data-testid="command-browse"
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Browse All Recipes
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
              onSelect={() => runCommand(() => navigate("/family"))}
              data-testid="command-family-settings"
            >
              <Settings className="mr-2 h-4 w-4" />
              Family Settings
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
            <SheetClose asChild>
              <Link href="/home">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-3"
                  data-testid="mobile-nav-home"
                >
                  <TrendingUp className="h-4 w-4" />
                  Home
                </Button>
              </Link>
            </SheetClose>
            <SheetClose asChild>
              <Link href="/add-recipe">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-3"
                  data-testid="mobile-nav-add"
                >
                  <Plus className="h-4 w-4" />
                  Add a Recipe
                </Button>
              </Link>
            </SheetClose>
            <SheetClose asChild>
              <Link href="/my-recipes">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-3"
                  data-testid="mobile-nav-my-recipes"
                >
                  <ChefHat className="h-4 w-4" />
                  My Recipes
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
                  <BookOpen className="h-4 w-4" />
                  Browse All Recipes
                </Button>
              </Link>
            </SheetClose>
            
            <div className="my-3 border-t border-border" />
            
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
            
            <SheetClose asChild>
              <Link href="/family">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-3"
                  data-testid="mobile-nav-family-settings"
                >
                  <Users className="h-4 w-4" />
                  Family Settings
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
