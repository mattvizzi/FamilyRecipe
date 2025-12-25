import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Menu, Globe, Plus, Bell, User, ChefHat, TrendingUp, Users, Sun, Moon, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/components/theme-provider";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { recipeCategories } from "@shared/schema";

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  data: { recipeId?: string; recipeName?: string; error?: string } | null;
  isRead: boolean;
  createdAt: string;
}

interface ProcessingJob {
  id: string;
  status: string;
  inputType: string;
  createdAt: string;
}

export function MobileBottomNav() {
  const [location, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, logout, isLoggingOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();

  const { data: unreadCount = 0 } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    refetchInterval: 15000,
  });

  const { data: activeJobs = [] } = useQuery<ProcessingJob[]>({
    queryKey: ["/api/jobs/active"],
    refetchInterval: 10000,
  });

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: notificationsOpen,
  });

  const count = typeof unreadCount === "object" ? unreadCount.count : 0;
  const hasActiveJobs = activeJobs.length > 0;

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await apiRequest("POST", `/api/notifications/${notification.id}/read`);
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    }

    if (notification.type === "recipe_processed" && notification.data?.recipeId) {
      setLocation(`/recipe/${notification.data.recipeId}`);
      setNotificationsOpen(false);
    }
  };

  const handleMarkAllRead = async () => {
    await apiRequest("POST", "/api/notifications/mark-all-read");
    queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
  };

  const getInitials = () => {
    if (!user) return "?";
    const first = user.firstName?.[0] || "";
    const last = user.lastName?.[0] || "";
    return (first + last).toUpperCase() || user.email?.[0]?.toUpperCase() || "?";
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const isActive = (path: string) => {
    if (path === "/recipes") {
      return location?.startsWith("/recipes") || location?.startsWith("/recipe/");
    }
    return location === path;
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border sm:hidden pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-14">
          {/* Menu */}
          <button
            onClick={() => setMenuOpen(true)}
            className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-muted-foreground hover-elevate active-elevate-2"
            data-testid="mobile-nav-menu"
          >
            <Menu className="h-5 w-5" />
            <span className="text-[10px]">Menu</span>
          </button>

          {/* Recipes */}
          <Link href="/recipes">
            <button
              className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 hover-elevate active-elevate-2 ${
                isActive("/recipes") ? "text-primary" : "text-muted-foreground"
              }`}
              data-testid="mobile-nav-recipes"
            >
              <Globe className="h-5 w-5" />
              <span className="text-[10px]">Recipes</span>
            </button>
          </Link>

          {/* Add Recipe - Prominent center button */}
          <Link href="/add-recipe">
            <button
              className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 hover-elevate active-elevate-2 ${
                isActive("/add-recipe") ? "text-primary" : "text-muted-foreground"
              }`}
              data-testid="mobile-nav-add"
            >
              <div className="bg-primary rounded-full p-1.5 -mt-1">
                <Plus className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-[10px]">Add</span>
            </button>
          </Link>

          {/* Notifications */}
          <button
            onClick={() => setNotificationsOpen(true)}
            className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-muted-foreground hover-elevate active-elevate-2 relative"
            data-testid="mobile-nav-notifications"
          >
            <div className="relative">
              <Bell className={`h-5 w-5 ${hasActiveJobs ? "animate-pulse" : ""}`} />
              {hasActiveJobs && count === 0 && (
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary animate-pulse" />
              )}
              {count > 0 && (
                <span className="absolute -top-1 -right-1.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[9px] flex items-center justify-center font-medium">
                  {count > 9 ? "9+" : count}
                </span>
              )}
            </div>
            <span className="text-[10px]">Alerts</span>
          </button>

          {/* Profile */}
          <button
            onClick={() => setProfileOpen(true)}
            className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-muted-foreground hover-elevate active-elevate-2"
            data-testid="mobile-nav-profile"
          >
            <Avatar className="h-5 w-5">
              <AvatarImage src={user?.profileImageUrl || undefined} alt="Profile" />
              <AvatarFallback className="text-[8px] font-medium bg-muted">{getInitials()}</AvatarFallback>
            </Avatar>
            <span className="text-[10px]">Profile</span>
          </button>
        </div>
      </nav>

      {/* Menu Sheet */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
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
                <Button variant="ghost" className="w-full justify-start gap-3" data-testid="sheet-nav-home">
                  <TrendingUp className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
            </SheetClose>
            <SheetClose asChild>
              <Link href="/family-recipes">
                <Button variant="ghost" className="w-full justify-start gap-3" data-testid="sheet-nav-family-recipes">
                  <ChefHat className="h-4 w-4" />
                  Family Recipes
                </Button>
              </Link>
            </SheetClose>
            <SheetClose asChild>
              <Link href="/recipes">
                <Button variant="ghost" className="w-full justify-start gap-3" data-testid="sheet-nav-all-recipes">
                  <Globe className="h-4 w-4" />
                  All Recipes
                </Button>
              </Link>
            </SheetClose>

            <div className="my-3 border-t border-border" />

            <p className="px-3 text-xs font-medium text-muted-foreground mb-2">Categories</p>
            {recipeCategories.map((cat) => (
              <SheetClose key={cat} asChild>
                <Link href={`/recipes/${cat.toLowerCase()}`}>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" data-testid={`sheet-nav-category-${cat.toLowerCase()}`}>
                    {cat}
                  </Button>
                </Link>
              </SheetClose>
            ))}
          </nav>
        </SheetContent>
      </Sheet>

      {/* Notifications Drawer */}
      <Drawer open={notificationsOpen} onOpenChange={setNotificationsOpen}>
        <DrawerContent>
          <DrawerHeader className="border-b">
            <div className="flex items-center justify-between">
              <DrawerTitle>Notifications</DrawerTitle>
              {count > 0 && (
                <Button variant="ghost" size="sm" onClick={handleMarkAllRead} data-testid="button-mark-all-read">
                  Mark all read
                </Button>
              )}
            </div>
          </DrawerHeader>
          <div className="max-h-[60vh] overflow-y-auto overscroll-contain">
            {activeJobs.length > 0 && (
              <div className="border-b">
                {activeJobs.map((job) => (
                  <div key={job.id} className="p-3 bg-primary/5" data-testid={`job-processing-${job.id}`}>
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">Processing Recipe</p>
                        <p className="text-xs text-muted-foreground">
                          Started {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {notifications.length === 0 && activeJobs.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                No notifications yet
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full p-3 text-left hover-elevate active-elevate-2 transition-colors ${
                      !notification.isRead ? "bg-muted/50" : ""
                    }`}
                    data-testid={`notification-item-${notification.id}`}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${
                        notification.type === "recipe_processed" 
                          ? "bg-green-500" 
                          : notification.type === "recipe_failed"
                          ? "bg-destructive"
                          : "bg-primary"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{notification.title}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Profile Drawer */}
      <Drawer open={profileOpen} onOpenChange={setProfileOpen}>
        <DrawerContent>
          <DrawerHeader className="border-b">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.profileImageUrl || undefined} alt="Profile" />
                <AvatarFallback className="text-sm font-medium bg-muted">{getInitials()}</AvatarFallback>
              </Avatar>
              <div>
                <DrawerTitle>{user?.firstName} {user?.lastName}</DrawerTitle>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
          </DrawerHeader>
          <div className="p-2">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3"
              onClick={() => { setProfileOpen(false); setLocation("/family"); }}
              data-testid="profile-nav-family"
            >
              <Users className="h-4 w-4" />
              Family Settings
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3"
              onClick={toggleTheme}
              data-testid="profile-nav-theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </Button>
            <div className="my-2 border-t border-border" />
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-destructive"
              onClick={() => logout()}
              disabled={isLoggingOut}
              data-testid="profile-nav-logout"
            >
              <LogOut className="h-4 w-4" />
              {isLoggingOut ? "Signing out..." : "Sign Out"}
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
