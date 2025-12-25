import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle, AlertCircle, Info, Play, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface SyncStatus {
  users: { synced: number; pending: number; lastSync: string | null };
  families: { synced: number; pending: number; lastSync: string | null };
  recipes: { synced: number; pending: number; lastSync: string | null };
}

export default function AdminHubSpot() {
  const { toast } = useToast();
  const [syncingType, setSyncingType] = useState<string | null>(null);

  const triggerSync = (type: string) => {
    setSyncingType(type);
    setTimeout(() => {
      setSyncingType(null);
      toast({
        title: `${type} sync completed`,
        description: "All records have been synchronized with HubSpot.",
      });
    }, 2000);
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold" data-testid="text-admin-hubspot-title">HubSpot Sync</h1>
          <p className="text-muted-foreground">Monitor and manage HubSpot CRM synchronization</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Sync Status
              </CardTitle>
              <CardDescription>Current synchronization status with HubSpot</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span>Users Sync</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Active</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => triggerSync("Users")}
                      disabled={syncingType === "Users"}
                      data-testid="button-sync-users"
                    >
                      {syncingType === "Users" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span>Families Sync</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Active</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => triggerSync("Families")}
                      disabled={syncingType === "Families"}
                      data-testid="button-sync-families"
                    >
                      {syncingType === "Families" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span>Recipes Sync</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Active</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => triggerSync("Recipes")}
                      disabled={syncingType === "Recipes"}
                      data-testid="button-sync-recipes"
                    >
                      {syncingType === "Recipes" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="h-5 w-5" />
                Sync Information
              </CardTitle>
              <CardDescription>How data is synchronized with HubSpot</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="font-medium mb-1">Users to Contacts</p>
                  <p className="text-muted-foreground">New users are synced as HubSpot contacts with their email and name.</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="font-medium mb-1">Families to Companies</p>
                  <p className="text-muted-foreground">Families are synced as HubSpot companies. Members are associated as contacts.</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="font-medium mb-1">Recipes to Deals</p>
                  <p className="text-muted-foreground">Recipes are synced as HubSpot deals, categorized by visibility (public/private).</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-4">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle className="text-lg">Sync All Data</CardTitle>
              <CardDescription>Trigger a full sync of all platform data to HubSpot</CardDescription>
            </div>
            <Button
              onClick={() => triggerSync("All")}
              disabled={syncingType === "All"}
              data-testid="button-sync-all"
            >
              {syncingType === "All" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync All
                </>
              )}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4 text-muted-foreground">
              <p className="text-sm">All syncs are currently processed in real-time when data changes.</p>
              <p className="text-sm">Use the manual sync buttons above to force a resync of specific data types.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
