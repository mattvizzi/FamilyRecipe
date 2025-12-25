import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

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
}

export default function AdminUsers() {
  const { data: users, isLoading } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
  });

  const getInitials = (user: AdminUser) => {
    const first = user.firstName?.[0] || "";
    const last = user.lastName?.[0] || "";
    return (first + last).toUpperCase() || user.email?.[0]?.toUpperCase() || "?";
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold" data-testid="text-admin-users-title">Users</h1>
          <p className="text-muted-foreground">Manage all registered users</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">All Users ({users?.length ?? 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Family</TableHead>
                    <TableHead className="text-right">Recipes</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((user) => (
                    <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.profileImageUrl || undefined} />
                            <AvatarFallback className="text-xs">{getInitials(user)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">
                            {user.firstName || user.lastName 
                              ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
                              : "Unknown User"
                            }
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.email || "—"}
                      </TableCell>
                      <TableCell>
                        {user.familyName ? (
                          <Badge variant="secondary">{user.familyName}</Badge>
                        ) : (
                          <span className="text-muted-foreground">No family</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">{user.recipeCount}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(user.createdAt), "MMM d, yyyy")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
