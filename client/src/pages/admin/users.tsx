import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminDataGrid, Column } from "@/components/admin-data-grid";
import { format } from "date-fns";
import { Shield, ShieldOff } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AdminUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  createdAt: string;
  familyId: string | null;
  familyName: string | null;
  recipeCount: number;
  isAdmin: boolean;
}

export default function AdminUsers() {
  const { toast } = useToast();
  const { data: users = [], isLoading } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
  });

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleAdminMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest("POST", `/api/admin/users/${userId}/toggle-admin`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Admin status updated" });
    },
    onError: () => {
      toast({ title: "Failed to update admin status", variant: "destructive" });
    },
  });

  const getInitials = (user: AdminUser) => {
    const first = user.firstName?.[0] || "";
    const last = user.lastName?.[0] || "";
    return (first + last).toUpperCase() || user.email?.[0]?.toUpperCase() || "?";
  };

  const columns: Column<AdminUser>[] = [
    {
      key: "firstName",
      header: "User",
      sortable: true,
      render: (user) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.profileImageUrl || undefined} />
            <AvatarFallback className="text-xs">{getInitials(user)}</AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-2">
            <span className="font-medium">
              {user.firstName || user.lastName
                ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
                : "Unknown User"}
            </span>
            {user.isAdmin && (
              <Badge variant="default" className="text-xs">Admin</Badge>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      sortable: true,
      render: (user) => (
        <span className="text-muted-foreground">{user.email || "—"}</span>
      ),
    },
    {
      key: "familyName",
      header: "Family",
      sortable: true,
      render: (user) =>
        user.familyName ? (
          <Badge variant="secondary">{user.familyName}</Badge>
        ) : (
          <span className="text-muted-foreground">No family</span>
        ),
    },
    {
      key: "recipeCount",
      header: "Recipes",
      sortable: true,
      className: "text-right",
      render: (user) => user.recipeCount,
    },
    {
      key: "createdAt",
      header: "Joined",
      sortable: true,
      render: (user) => (
        <span className="text-muted-foreground">
          {format(new Date(user.createdAt), "MMM d, yyyy")}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (user) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => toggleAdminMutation.mutate(user.id)}
          disabled={toggleAdminMutation.isPending}
          title={user.isAdmin ? "Remove admin" : "Make admin"}
          data-testid={`button-toggle-admin-${user.id}`}
        >
          {user.isAdmin ? (
            <ShieldOff className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Shield className="h-4 w-4" />
          )}
        </Button>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold" data-testid="text-admin-users-title">Users</h1>
          <p className="text-muted-foreground">Manage all registered users</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">All Users ({users.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <AdminDataGrid
              data={users}
              columns={columns}
              isLoading={isLoading}
              searchPlaceholder="Search users..."
              searchKeys={["firstName", "lastName", "email"]}
              selectable={true}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              getRowId={(user) => user.id}
              emptyMessage="No users found"
              pageSize={10}
              exportFilename="users.csv"
              exportKeys={["id", "email", "firstName", "lastName", "familyName", "recipeCount", "createdAt", "isAdmin"]}
            />
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
