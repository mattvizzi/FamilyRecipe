import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CheckCircle, AlertCircle, Info } from "lucide-react";

export default function AdminHubSpot() {
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
                  <Badge variant="secondary">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span>Families Sync</span>
                  </div>
                  <Badge variant="secondary">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span>Recipes Sync</span>
                  </div>
                  <Badge variant="secondary">Active</Badge>
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
                  <p className="font-medium mb-1">Users → Contacts</p>
                  <p className="text-muted-foreground">New users are synced as HubSpot contacts with their email and name.</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="font-medium mb-1">Families → Companies</p>
                  <p className="text-muted-foreground">Families are synced as HubSpot companies. Members are associated as contacts.</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="font-medium mb-1">Recipes → Deals</p>
                  <p className="text-muted-foreground">Recipes are synced as HubSpot deals, categorized by visibility (public/private).</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-lg">Recent Sync Activity</CardTitle>
            <CardDescription>Sync operations happen automatically when data changes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Sync activity logging coming soon</p>
              <p className="text-sm">All syncs are currently processed in real-time</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
