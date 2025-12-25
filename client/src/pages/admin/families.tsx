import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

interface AdminFamily {
  id: string;
  name: string;
  createdById: string;
  inviteCode: string;
  createdAt: string;
  memberCount: number;
  recipeCount: number;
  creatorName: string | null;
}

export default function AdminFamilies() {
  const { data: families, isLoading } = useQuery<AdminFamily[]>({
    queryKey: ["/api/admin/families"],
  });

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold" data-testid="text-admin-families-title">Families</h1>
          <p className="text-muted-foreground">Manage all family groups</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">All Families ({families?.length ?? 0})</CardTitle>
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
                    <TableHead>Family Name</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead className="text-right">Members</TableHead>
                    <TableHead className="text-right">Recipes</TableHead>
                    <TableHead>Invite Code</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {families?.map((family) => (
                    <TableRow key={family.id} data-testid={`row-family-${family.id}`}>
                      <TableCell className="font-medium">{family.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {family.creatorName || "Unknown"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{family.memberCount}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{family.recipeCount}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {family.inviteCode}
                        </code>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(family.createdAt), "MMM d, yyyy")}
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
