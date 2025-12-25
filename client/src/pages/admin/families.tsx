import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminDataGrid, Column } from "@/components/admin-data-grid";
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
  const { data: families = [], isLoading } = useQuery<AdminFamily[]>({
    queryKey: ["/api/admin/families"],
  });

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const columns: Column<AdminFamily>[] = [
    {
      key: "name",
      header: "Family Name",
      sortable: true,
      render: (family) => <span className="font-medium">{family.name}</span>,
    },
    {
      key: "creatorName",
      header: "Created By",
      sortable: true,
      render: (family) => (
        <span className="text-muted-foreground">{family.creatorName || "Unknown"}</span>
      ),
    },
    {
      key: "memberCount",
      header: "Members",
      sortable: true,
      className: "text-right",
      render: (family) => <Badge variant="secondary">{family.memberCount}</Badge>,
    },
    {
      key: "recipeCount",
      header: "Recipes",
      sortable: true,
      className: "text-right",
      render: (family) => family.recipeCount,
    },
    {
      key: "inviteCode",
      header: "Invite Code",
      render: (family) => (
        <code className="text-xs bg-muted px-2 py-1 rounded">{family.inviteCode}</code>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      sortable: true,
      render: (family) => (
        <span className="text-muted-foreground">
          {format(new Date(family.createdAt), "MMM d, yyyy")}
        </span>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold" data-testid="text-admin-families-title">Families</h1>
          <p className="text-muted-foreground">Manage all family groups</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">All Families ({families.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <AdminDataGrid
              data={families}
              columns={columns}
              isLoading={isLoading}
              searchPlaceholder="Search families..."
              searchKeys={["name", "creatorName"]}
              selectable={true}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              getRowId={(family) => family.id}
              emptyMessage="No families found"
              pageSize={10}
            />
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
