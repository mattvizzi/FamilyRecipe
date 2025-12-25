import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminDataGrid, Column, FilterOption } from "@/components/admin-data-grid";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface AdminComment {
  id: number;
  userId: string;
  recipeId: string;
  content: string;
  isHidden: boolean;
  createdAt: string;
  userName: string | null;
  recipeName: string | null;
}

export default function AdminComments() {
  const { toast } = useToast();
  const { data: comments = [], isLoading } = useQuery<AdminComment[]>({
    queryKey: ["/api/admin/comments"],
  });

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleHiddenMutation = useMutation({
    mutationFn: async (commentId: number) => {
      return apiRequest("POST", `/api/admin/comments/${commentId}/toggle-hidden`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/comments"] });
      toast({ title: "Comment visibility updated" });
    },
    onError: () => {
      toast({ title: "Failed to update comment", variant: "destructive" });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      return apiRequest("DELETE", `/api/admin/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/comments"] });
      toast({ title: "Comment deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete comment", variant: "destructive" });
    },
  });

  const columns: Column<AdminComment>[] = [
    {
      key: "content",
      header: "Comment",
      sortable: false,
      render: (comment) => (
        <div className="max-w-xs truncate">
          <span className={comment.isHidden ? "text-muted-foreground line-through" : ""}>
            {comment.content}
          </span>
        </div>
      ),
    },
    {
      key: "userName",
      header: "User",
      sortable: true,
      render: (comment) => (
        <span className="text-muted-foreground">{comment.userName || "Unknown"}</span>
      ),
    },
    {
      key: "recipeName",
      header: "Recipe",
      sortable: true,
      render: (comment) => (
        <span className="font-medium">{comment.recipeName || "Deleted"}</span>
      ),
    },
    {
      key: "isHidden",
      header: "Status",
      sortable: true,
      render: (comment) =>
        comment.isHidden ? (
          <Badge variant="secondary">Hidden</Badge>
        ) : (
          <Badge variant="outline">Visible</Badge>
        ),
    },
    {
      key: "createdAt",
      header: "Created",
      sortable: true,
      render: (comment) => (
        <span className="text-muted-foreground">
          {format(new Date(comment.createdAt), "MMM d, yyyy")}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (comment) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => toggleHiddenMutation.mutate(comment.id)}
            disabled={toggleHiddenMutation.isPending}
            title={comment.isHidden ? "Show comment" : "Hide comment"}
            data-testid={`button-toggle-hidden-${comment.id}`}
          >
            {comment.isHidden ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                title="Delete comment"
                data-testid={`button-delete-comment-${comment.id}`}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Comment</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this comment? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteCommentMutation.mutate(comment.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
    },
  ];

  const filters: FilterOption[] = [
    {
      key: "isHidden",
      label: "Status",
      options: [
        { value: "true", label: "Hidden" },
        { value: "false", label: "Visible" },
      ],
    },
  ];

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold" data-testid="text-admin-comments-title">Comments</h1>
          <p className="text-muted-foreground">Moderate user comments on recipes</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">All Comments ({comments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <AdminDataGrid
              data={comments}
              columns={columns}
              filters={filters}
              isLoading={isLoading}
              searchPlaceholder="Search comments..."
              searchKeys={["content", "userName", "recipeName"]}
              selectable={true}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              getRowId={(comment) => String(comment.id)}
              emptyMessage="No comments found"
              pageSize={10}
              exportFilename="comments.csv"
              exportKeys={["id", "content", "userName", "recipeName", "isHidden", "createdAt"]}
            />
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
