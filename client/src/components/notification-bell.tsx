import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { useLocation } from "wouter";
import { useIsMobile } from "@/hooks/use-mobile";

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

function NotificationContent({
  notifications,
  activeJobs,
  count,
  onNotificationClick,
  onMarkAllRead,
}: {
  notifications: Notification[];
  activeJobs: ProcessingJob[];
  count: number;
  onNotificationClick: (notification: Notification) => void;
  onMarkAllRead: () => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between gap-2 p-3 border-b">
        <h3 className="font-semibold">Notifications</h3>
        {count > 0 && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onMarkAllRead}
            data-testid="button-mark-all-read"
          >
            Mark all read
          </Button>
        )}
      </div>
      <div className="max-h-[60vh] overflow-y-auto overscroll-contain">
        {activeJobs.length > 0 && (
          <div className="border-b">
            {activeJobs.map((job) => (
              <div
                key={job.id}
                className="p-3 bg-primary/5"
                data-testid={`job-processing-${job.id}`}
              >
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
          <div className="p-4 text-center text-muted-foreground">
            No notifications yet
          </div>
        ) : notifications.length === 0 && activeJobs.length > 0 ? null : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => onNotificationClick(notification)}
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
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
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
    </>
  );
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

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
    enabled: open,
  });

  useEffect(() => {
    if (open) {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    }
  }, [open, queryClient]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await apiRequest("POST", `/api/notifications/${notification.id}/read`);
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    }

    if (notification.type === "recipe_processed" && notification.data?.recipeId) {
      setLocation(`/recipe/${notification.data.recipeId}`);
      setOpen(false);
    }
  };

  const handleMarkAllRead = async () => {
    await apiRequest("POST", "/api/notifications/mark-all-read");
    queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
  };

  const count = typeof unreadCount === "object" ? unreadCount.count : 0;
  const hasActiveJobs = activeJobs.length > 0;

  const bellButton = (
    <Button 
      variant="ghost" 
      size="icon" 
      className="relative"
      data-testid="button-notifications"
    >
      <Bell className={`h-5 w-5 ${hasActiveJobs ? "animate-pulse" : ""}`} />
      {hasActiveJobs && count === 0 && (
        <span 
          className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary animate-pulse"
          data-testid="badge-processing"
        />
      )}
      {count > 0 && (
        <span 
          className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium"
          data-testid="badge-unread-count"
        >
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Button>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          {bellButton}
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader className="sr-only">
            <DrawerTitle>Notifications</DrawerTitle>
          </DrawerHeader>
          <NotificationContent
            notifications={notifications}
            activeJobs={activeJobs}
            count={count}
            onNotificationClick={handleNotificationClick}
            onMarkAllRead={handleMarkAllRead}
          />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {bellButton}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <NotificationContent
          notifications={notifications}
          activeJobs={activeJobs}
          count={count}
          onNotificationClick={handleNotificationClick}
          onMarkAllRead={handleMarkAllRead}
        />
      </PopoverContent>
    </Popover>
  );
}
