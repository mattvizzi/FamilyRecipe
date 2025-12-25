import { useState, useEffect, useMemo } from "react";
import { Helmet } from "react-helmet";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
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
import { LogOut, Search, LayoutDashboard, Users, Home as HomeIcon, ChefHat, RefreshCw, ExternalLink, Sun, Moon, Bot, MessageSquare, ChevronDown, Database, Puzzle, Menu } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/components/theme-provider";
import { AdminAISidebar } from "./admin-ai-sidebar";

interface AdminLayoutProps {
  children: React.ReactNode;
}

// Helper to detect if we're on the admin subdomain (cached at module level)
const ADMIN_DOMAIN = "admin.familyrecipe.app";
const MAIN_DOMAIN = "familyrecipe.app";

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

// Pre-compute navigation items at module level (stable across renders)
// Standardized paths used in both development and production
const onAdminSubdomain = typeof window !== "undefined" && window.location.hostname === ADMIN_DOMAIN;

const OBJECT_ITEMS = [
  { title: "Users", href: "/objects/users", icon: Users },
  { title: "Families", href: "/objects/families", icon: HomeIcon },
  { title: "Recipes", href: "/objects/recipes", icon: ChefHat },
  { title: "Comments", href: "/objects/comments", icon: MessageSquare },
];

const INTEGRATION_ITEMS = [
  { title: "HubSpot", href: "/integrations/hubspot", icon: RefreshCw },
];

const DASHBOARD_HREF = "/dashboard";

const ALL_NAV_ITEMS = [
  { title: "Dashboard", href: DASHBOARD_HREF, icon: LayoutDashboard },
  ...OBJECT_ITEMS,
  ...INTEGRATION_ITEMS,
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout, isLoggingOut } = useAuth();
  const [location, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const [aiSidebarOpen, setAiSidebarOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  
  // Use pre-computed module-level constants for stable navigation
  const objectItems = OBJECT_ITEMS;
  const integrationItems = INTEGRATION_ITEMS;
  const allNavItems = ALL_NAV_ITEMS;
  const dashboardHref = DASHBOARD_HREF;
  const isOnAdminSubdomain = onAdminSubdomain;

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

  const getInitials = () => {
    if (!user) return "?";
    const first = user.firstName?.[0] || "";
    const last = user.lastName?.[0] || "";
    return (first + last).toUpperCase() || user.email?.[0]?.toUpperCase() || "?";
  };

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="min-h-screen bg-background">
        <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border h-14">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-4">
            {/* Mobile: Hamburger Left */}
            <div className="flex items-center gap-2 md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileNavOpen(true)}
                data-testid="button-admin-mobile-menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>

            {/* Logo - Centered on mobile, left on desktop */}
            <div className="absolute left-1/2 transform -translate-x-1/2 md:relative md:left-0 md:transform-none">
              <Link href={dashboardHref}>
                <div className="flex items-center cursor-pointer" data-testid="link-admin-home">
                  <span className="text-xl font-bold tracking-tight text-primary">Family</span>
                  <span className="text-xl font-light text-foreground tracking-tight">Recipe</span>
                  <span className="ml-2 text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">Admin</span>
                </div>
              </Link>
            </div>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-6">
              <nav className="flex items-center gap-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={objectItems.some(item => location === item.href) ? "bg-accent" : ""}
                      data-testid="nav-objects-dropdown"
                    >
                      <Database className="h-4 w-4 mr-2" />
                      Objects
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {objectItems.map((item) => (
                      <DropdownMenuItem key={item.href} asChild className="cursor-pointer">
                        <Link href={item.href} className="flex items-center gap-2" data-testid={`nav-${item.title.toLowerCase()}`}>
                          <item.icon className="h-4 w-4" />
                          {item.title}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={integrationItems.some(item => location === item.href) ? "bg-accent" : ""}
                      data-testid="nav-integrations-dropdown"
                    >
                      <Puzzle className="h-4 w-4 mr-2" />
                      Integrations
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {integrationItems.map((item) => (
                      <DropdownMenuItem key={item.href} asChild className="cursor-pointer">
                        <Link href={item.href} className="flex items-center gap-2" data-testid={`nav-${item.title.toLowerCase()}`}>
                          <item.icon className="h-4 w-4" />
                          {item.title}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </nav>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:flex items-center gap-2 text-muted-foreground w-40 justify-between"
                onClick={() => setOpen(true)}
                data-testid="button-admin-search"
              >
                <span className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Search...
                </span>
                <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="sm:hidden"
                onClick={() => setOpen(true)}
                data-testid="button-admin-search-mobile"
              >
                <Search className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setAiSidebarOpen(!aiSidebarOpen)}
                className={aiSidebarOpen ? "bg-accent" : ""}
                data-testid="button-toggle-ai-sidebar"
              >
                <Bot className="h-4 w-4" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-lg" data-testid="button-admin-user-menu">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.profileImageUrl || undefined} alt="Profile" />
                      <AvatarFallback className="text-sm font-medium bg-muted">{getInitials()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 p-1.5">
                  <div className="px-2.5 py-2">
                    <p className="text-sm font-medium" data-testid="text-admin-user-name">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate" data-testid="text-admin-user-email">
                      {user?.email}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="cursor-pointer">
                    {isOnAdminSubdomain ? (
                      <a href={getMainDomainUrl("/home")} className="flex items-center gap-2" data-testid="dropdown-go-to-website">
                        <ExternalLink className="h-4 w-4" />
                        Go to Website
                      </a>
                    ) : (
                      <Link href="/home" className="flex items-center gap-2" data-testid="dropdown-go-to-website">
                        <ExternalLink className="h-4 w-4" />
                        Go to Website
                      </Link>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={toggleTheme}
                    className="cursor-pointer"
                    data-testid="dropdown-admin-theme-toggle"
                  >
                    {theme === "dark" ? (
                      <Sun className="h-4 w-4 mr-2" />
                    ) : (
                      <Moon className="h-4 w-4 mr-2" />
                    )}
                    {theme === "dark" ? "Light Mode" : "Dark Mode"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => logout()}
                    disabled={isLoggingOut}
                    className="text-destructive focus:text-destructive cursor-pointer"
                    data-testid="button-admin-logout"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {isLoggingOut ? "Signing out..." : "Sign Out"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className={`pt-14 transition-all duration-200 ${aiSidebarOpen ? "mr-80 lg:mr-96" : ""}`}>
          {children}
        </main>

        <AdminAISidebar isOpen={aiSidebarOpen} onClose={() => setAiSidebarOpen(false)} />
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Search admin pages..." 
          data-testid="input-admin-command-search"
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Admin Pages">
            {allNavItems.map((item) => (
              <CommandItem
                key={item.href}
                onSelect={() => runCommand(() => navigate(item.href))}
                data-testid={`command-admin-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.title}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Quick Actions">
            <CommandItem
              onSelect={() => {
                if (isOnAdminSubdomain) {
                  window.location.href = getMainDomainUrl("/home");
                } else {
                  runCommand(() => navigate("/home"));
                }
              }}
              data-testid="command-go-to-website"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Go to Website
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      {/* Mobile Navigation Sheet */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="p-4 border-b border-border">
            <SheetTitle className="flex items-center">
              <span className="text-xl font-bold tracking-tight text-primary">Family</span>
              <span className="text-xl font-light text-foreground tracking-tight">Recipe</span>
              <span className="ml-2 text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">Admin</span>
            </SheetTitle>
          </SheetHeader>
          <div className="py-4">
            {/* Dashboard */}
            <div className="px-3 mb-2">
              <SheetClose asChild>
                <Link href={dashboardHref}>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start gap-3 ${location === dashboardHref ? "bg-accent" : ""}`}
                    data-testid="mobile-nav-dashboard"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
              </SheetClose>
            </div>

            {/* Objects Section */}
            <div className="px-3 py-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-3">Objects</p>
              {objectItems.map((item) => (
                <SheetClose key={item.href} asChild>
                  <Link href={item.href}>
                    <Button
                      variant="ghost"
                      className={`w-full justify-start gap-3 mb-1 ${location === item.href ? "bg-accent" : ""}`}
                      data-testid={`mobile-nav-${item.title.toLowerCase()}`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.title}
                    </Button>
                  </Link>
                </SheetClose>
              ))}
            </div>

            {/* Integrations Section */}
            <div className="px-3 py-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-3">Integrations</p>
              {integrationItems.map((item) => (
                <SheetClose key={item.href} asChild>
                  <Link href={item.href}>
                    <Button
                      variant="ghost"
                      className={`w-full justify-start gap-3 mb-1 ${location === item.href ? "bg-accent" : ""}`}
                      data-testid={`mobile-nav-${item.title.toLowerCase()}`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.title}
                    </Button>
                  </Link>
                </SheetClose>
              ))}
            </div>

            {/* Divider */}
            <div className="border-t border-border my-2" />

            {/* Quick Actions */}
            <div className="px-3 py-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-3">Quick Actions</p>
              <SheetClose asChild>
                {isOnAdminSubdomain ? (
                  <a href={getMainDomainUrl("/home")}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3"
                      data-testid="mobile-nav-go-to-website"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Go to Website
                    </Button>
                  </a>
                ) : (
                  <Link href="/home">
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3"
                      data-testid="mobile-nav-go-to-website"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Go to Website
                    </Button>
                  </Link>
                )}
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
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
