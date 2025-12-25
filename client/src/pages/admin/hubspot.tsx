import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle, AlertCircle, Info, Play, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface SyncResult {
  success: boolean;
  synced?: number;
  failed?: number;
  total?: number;
  results?: {
    users: { synced: number; failed: number };
    families: { synced: number; failed: number };
    recipes: { synced: number; failed: number };
  };
}

export default function AdminHubSpot() {
  const { toast } = useToast();

  const syncUsersMutation = useMutation({
    mutationFn: () => apiRequest<SyncResult>("/api/admin/hubspot/sync/users", { method: "POST" }),
    onSuccess: (data) => {
      toast({
        title: "Users sync completed",
        description: `Synced ${data.synced} of ${data.total} users. ${data.failed} failed.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Sync failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const syncFamiliesMutation = useMutation({
    mutationFn: () => apiRequest<SyncResult>("/api/admin/hubspot/sync/families", { method: "POST" }),
    onSuccess: (data) => {
      toast({
        title: "Families sync completed",
        description: `Synced ${data.synced} of ${data.total} families. ${data.failed} failed.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Sync failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const syncRecipesMutation = useMutation({
    mutationFn: () => apiRequest<SyncResult>("/api/admin/hubspot/sync/recipes", { method: "POST" }),
    onSuccess: (data) => {
      toast({
        title: "Recipes sync completed",
        description: `Synced ${data.synced} of ${data.total} recipes. ${data.failed} failed.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Sync failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const syncAllMutation = useMutation({
    mutationFn: () => apiRequest<SyncResult>("/api/admin/hubspot/sync/all", { method: "POST" }),
    onSuccess: (data) => {
      if (data.results) {
        const { users, families, recipes } = data.results;
        toast({
          title: "Full sync completed",
          description: `Users: ${users.synced} synced, ${users.failed} failed. Families: ${families.synced} synced, ${families.failed} failed. Recipes: ${recipes.synced} synced, ${recipes.failed} failed.`,
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Sync failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isSyncing = syncUsersMutation.isPending || syncFamiliesMutation.isPending || syncRecipesMutation.isPending || syncAllMutation.isPending;

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold" data-testid="text-admin-hubspot-title">HubSpot</h1>
          <p className="text-muted-foreground">Monitor and manage HubSpot CRM synchronization</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Manual Sync
              </CardTitle>
              <CardDescription>Trigger manual synchronization with HubSpot</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span>Users to Contacts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Active</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => syncUsersMutation.mutate()}
                      disabled={isSyncing}
                      data-testid="button-sync-users"
                    >
                      {syncUsersMutation.isPending ? (
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
                    <span>Families to Companies</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Active</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => syncFamiliesMutation.mutate()}
                      disabled={isSyncing}
                      data-testid="button-sync-families"
                    >
                      {syncFamiliesMutation.isPending ? (
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
                    <span>Recipes to Deals</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Active</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => syncRecipesMutation.mutate()}
                      disabled={isSyncing}
                      data-testid="button-sync-recipes"
                    >
                      {syncRecipesMutation.isPending ? (
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
              onClick={() => syncAllMutation.mutate()}
              disabled={isSyncing}
              data-testid="button-sync-all"
            >
              {syncAllMutation.isPending ? (
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
              <p className="text-sm">Data is automatically synced to HubSpot when changes occur.</p>
              <p className="text-sm">Use manual sync to force a resync of all existing records.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
