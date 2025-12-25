import { useState, useEffect } from "react";
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
import { LogOut, Search, LayoutDashboard, Users, Home as HomeIcon, ChefHat, RefreshCw, ExternalLink, Sun, Moon, Bot } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/components/theme-provider";
import { AdminAISidebar } from "@/components/admin-ai-sidebar";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const adminNavItems = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { title: "Users", href: "/admin/users", icon: Users },
  { title: "Families", href: "/admin/families", icon: HomeIcon },
  { title: "Recipes", href: "/admin/recipes", icon: ChefHat },
  { title: "HubSpot Sync", href: "/admin/hubspot", icon: RefreshCw },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout, isLoggingOut } = useAuth();
  const [location, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const [aiSidebarOpen, setAiSidebarOpen] = useState(false);
  const { theme, setTheme } = useTheme();

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
            <div className="flex items-center gap-6">
              <Link href="/admin">
                <div className="flex items-center cursor-pointer" data-testid="link-admin-home">
                  <span className="text-xl font-bold tracking-tight text-primary">Family</span>
                  <span className="text-xl font-light text-foreground tracking-tight">Recipe</span>
                  <span className="ml-2 text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">Admin</span>
                </div>
              </Link>

              <nav className="hidden md:flex items-center gap-1">
                {adminNavItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={location === item.href ? "bg-accent" : ""}
                      data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <item.icon className="h-4 w-4 mr-2" />
                      {item.title}
                    </Button>
                  </Link>
                ))}
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
                    <Link href="/home" className="flex items-center gap-2" data-testid="dropdown-go-to-website">
                      <ExternalLink className="h-4 w-4" />
                      Go to Website
                    </Link>
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
            {adminNavItems.map((item) => (
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
              onSelect={() => runCommand(() => navigate("/home"))}
              data-testid="command-go-to-website"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Go to Website
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
