import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { RecipeEditDrawer } from "@/components/recipe-edit-drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  Clock, 
  Users, 
  ChevronDown, 
  Pencil,
  Trash2,
  Copy,
  FileDown,
  Minus,
  Plus,
  Bookmark,
  Star,
  ChefHat,
  Eye,
  MessageCircle,
  EyeOff,
  Globe,
  Lock,
  Send,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { scaleAmount } from "@shared/lib/fraction";
import { abbreviateUnit } from "@/lib/units";
import type { RecipeWithStats, Family, CommentWithUser } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

export default function RecipeDetail() {
  const [, params] = useRoute("/recipe/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const recipeId = params?.id;

  const [scale, setScale] = useState(1);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set([0]));
  const [newComment, setNewComment] = useState("");
  const [hoverRating, setHoverRating] = useState(0);

  const { data: family } = useQuery<Family>({
    queryKey: ["/api/family"],
  });

  const { data: recipe, isLoading } = useQuery<RecipeWithStats>({
    queryKey: ["/api/recipes", recipeId, "stats"],
    queryFn: async () => {
      const res = await fetch(`/api/recipes/${recipeId}/stats`);
      if (!res.ok) throw new Error("Failed to fetch recipe");
      return res.json();
    },
    enabled: !!recipeId,
  });

  const { data: comments = [], isLoading: commentsLoading } = useQuery<CommentWithUser[]>({
    queryKey: ["/api/recipes", recipeId, "comments"],
    queryFn: async () => {
      const res = await fetch(`/api/recipes/${recipeId}/comments`);
      if (!res.ok) throw new Error("Failed to fetch comments");
      return res.json();
    },
    enabled: !!recipeId,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/recipes/${recipeId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      navigate("/my-recipes");
      toast({ title: "Deleted", description: "Recipe deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete recipe", variant: "destructive" });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (recipe?.isSaved) {
        return apiRequest("DELETE", `/api/recipes/${recipeId}/save`);
      }
      return apiRequest("POST", `/api/recipes/${recipeId}/save`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes", recipeId, "stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recipes/saved"] });
      toast({ 
        title: recipe?.isSaved ? "Removed" : "Saved", 
        description: recipe?.isSaved ? "Recipe removed from saved" : "Recipe saved to your collection" 
      });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save recipe", variant: "destructive" });
    },
  });

  const rateMutation = useMutation({
    mutationFn: async (rating: number) => {
      return apiRequest("POST", `/api/recipes/${recipeId}/rate`, { rating });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes", recipeId, "stats"] });
      toast({ title: "Rated", description: "Your rating has been saved" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to rate recipe", variant: "destructive" });
    },
  });

  const cookMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/recipes/${recipeId}/cook`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes", recipeId, "stats"] });
      toast({ title: "Cooked!", description: "You've marked this recipe as cooked" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error?.message || "Failed to mark as cooked", 
        variant: "destructive" 
      });
    },
  });

  const visibilityMutation = useMutation({
    mutationFn: async (isPublic: boolean) => {
      return apiRequest("PATCH", `/api/recipes/${recipeId}/visibility`, { isPublic });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes", recipeId, "stats"] });
      toast({ title: "Updated", description: "Recipe visibility changed" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update visibility", variant: "destructive" });
    },
  });

  const commentMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/recipes/${recipeId}/comments`, { content: newComment });
    },
    onSuccess: () => {
      setNewComment("");
      queryClient.invalidateQueries({ queryKey: ["/api/recipes", recipeId, "comments"] });
      toast({ title: "Posted", description: "Your comment has been added" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error?.message || "Failed to post comment", 
        variant: "destructive" 
      });
    },
  });

  const hideCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      return apiRequest("PATCH", `/api/recipes/${recipeId}/comments/${commentId}/hide`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes", recipeId, "comments"] });
      toast({ title: "Hidden", description: "Comment has been hidden" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to hide comment", variant: "destructive" });
    },
  });

  const toggleGroup = (index: number) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedGroups(newExpanded);
  };

  const copyToClipboard = async () => {
    if (!recipe) return;
    
    let text = `${recipe.name}\n\n`;
    text += `Category: ${recipe.category}\n`;
    if (recipe.prepTime) text += `Prep Time: ${recipe.prepTime} min\n`;
    if (recipe.cookTime) text += `Cook Time: ${recipe.cookTime} min\n`;
    if (recipe.servings) text += `Servings: ${Math.round(recipe.servings * scale)}\n`;
    text += "\n";

    recipe.groups.forEach((group, i) => {
      if (recipe.groups.length > 1) {
        text += `--- ${group.name} ---\n\n`;
      }
      text += "Ingredients:\n";
      group.ingredients.forEach((ing) => {
        const scaledAmount = scaleAmount(ing.amount, scale);
        text += `- ${scaledAmount} ${ing.unit} ${ing.name}\n`;
      });
      text += "\nInstructions:\n";
      group.instructions.forEach((step, j) => {
        text += `${j + 1}. ${step}\n`;
      });
      if (i < recipe.groups.length - 1) text += "\n";
    });

    await navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Recipe copied to clipboard" });
  };

  const exportToPDF = async () => {
    if (!recipe) return;
    
    try {
      const response = await fetch(`/api/recipes/${recipeId}/pdf?scale=${scale}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${recipe.name.replace(/[^a-z0-9]/gi, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast({ title: "Downloaded", description: "PDF downloaded successfully" });
    } catch {
      toast({ title: "Error", description: "Failed to export PDF", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header family={family} />
        <main className="pt-20 px-6">
          <div className="max-w-5xl mx-auto">
            <Skeleton className="h-8 w-24 mb-6" />
            <Skeleton className="w-full aspect-[21/9] rounded-lg mb-6" />
            <div className="grid lg:grid-cols-[1fr,380px] gap-10">
              <div>
                <Skeleton className="h-8 w-2/3 mb-4" />
                <div className="flex gap-3 mb-6">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-24" />
                </div>
              </div>
              <div>
                <Skeleton className="h-64 rounded-lg" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen bg-background">
        <Header family={family} />
        <main className="pt-20 px-6">
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-xl font-bold mb-4">Recipe Not Found</h1>
            <Button asChild>
              <a href="/my-recipes">Go Back Home</a>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const isOwner = recipe.createdById === user?.id;

  return (
    <div className="min-h-screen bg-background">
      <Header family={family} />
      
      <div className="fixed top-14 left-0 right-0 z-40 bg-background border-b border-border">
        <div className="max-w-5xl mx-auto px-6 h-12 flex items-center justify-between gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate("/my-recipes")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-center gap-2">
            {!isOwner && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                data-testid="button-save"
              >
                <Bookmark className={`h-4 w-4 mr-2 ${recipe.isSaved ? "fill-current" : ""}`} />
                {recipe.isSaved ? "Saved" : "Save"}
              </Button>
            )}
            {isOwner && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => visibilityMutation.mutate(!recipe.isPublic)}
                disabled={visibilityMutation.isPending}
                data-testid="button-visibility"
              >
                {recipe.isPublic ? (
                  <>
                    <Globe className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Public</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Private</span>
                  </>
                )}
              </Button>
            )}
            {isOwner && (
              <Button variant="outline" size="sm" onClick={() => setEditDrawerOpen(true)} data-testid="button-edit">
                <Pencil className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={copyToClipboard} data-testid="button-copy">
              <Copy className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Copy</span>
            </Button>
            <Button variant="outline" size="sm" onClick={exportToPDF} data-testid="button-export-pdf">
              <FileDown className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
            {isOwner && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" data-testid="button-delete">
                    <Trash2 className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Delete</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Recipe?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete "{recipe.name}".
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => deleteMutation.mutate()}
                      className="bg-destructive text-destructive-foreground"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </div>
      
      <main className="pt-28 pb-12">
        <div className="w-full bg-muted border-b border-border">
          <div className="max-w-5xl mx-auto">
            <div className="aspect-[21/9] overflow-hidden">
              {recipe.imageUrl ? (
                <img 
                  src={recipe.imageUrl} 
                  alt={recipe.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  No Image
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 pt-6">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold mb-3" data-testid="text-recipe-name">
              {recipe.name}
            </h1>
            
            <div className="inline-flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 bg-muted rounded-lg border border-border">
              <Badge variant="secondary" className="text-xs" data-testid="badge-category">
                {recipe.category}
              </Badge>
              {recipe.isPublic ? (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Globe className="h-3 w-3" />
                  Public
                </div>
              ) : (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  Private
                </div>
              )}
              {(recipe.prepTime || 0) > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span className="font-data">{recipe.prepTime}m prep</span>
                </div>
              )}
              {(recipe.cookTime || 0) > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span className="font-data">{recipe.cookTime}m cook</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                <span className="font-data">{Math.round((recipe.servings || 4) * scale)} servings</span>
              </div>
              {recipe.creatorFirstName && (
                <div className="text-xs text-muted-foreground">
                  by {recipe.creatorFirstName} {recipe.creatorLastName}
                </div>
              )}
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr,380px] gap-10">
            <div className="space-y-8">
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ingredients</h2>
                  <div className="flex items-center gap-0.5 border border-border rounded-lg">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setScale(Math.max(0.5, scale - 0.5))}
                      disabled={scale <= 0.5}
                      data-testid="button-scale-down"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <span className="w-10 text-center text-sm font-data">{scale}x</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setScale(Math.min(4, scale + 0.5))}
                      disabled={scale >= 4}
                      data-testid="button-scale-up"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                {recipe.groups.map((group, groupIndex) => (
                  <div key={groupIndex} className={groupIndex > 0 ? "mt-5 pt-5 border-t border-border" : ""}>
                    {recipe.groups.length > 1 && (
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">{group.name}</p>
                    )}
                    <ul className="space-y-2">
                      {group.ingredients.map((ingredient, i) => {
                        const scaledAmount = scaleAmount(ingredient.amount, scale);
                        return (
                          <li key={i} className="flex items-baseline gap-2 text-sm" data-testid={`ingredient-${groupIndex}-${i}`}>
                            <span className="font-data font-medium text-primary whitespace-nowrap">{scaledAmount}</span>
                            <span className="text-muted-foreground whitespace-nowrap">{abbreviateUnit(ingredient.unit)}</span>
                            <span>{ingredient.name}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>

              {recipe.groups.map((group, groupIndex) => (
                <Collapsible
                  key={groupIndex}
                  open={expandedGroups.has(groupIndex)}
                  onOpenChange={() => toggleGroup(groupIndex)}
                >
                  {recipe.groups.length > 1 && (
                    <CollapsibleTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-between mb-3 h-10 bg-muted"
                        data-testid={`button-group-${groupIndex}`}
                      >
                        <span className="font-medium">{group.name}</span>
                        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${expandedGroups.has(groupIndex) ? "rotate-180" : ""}`} />
                      </Button>
                    </CollapsibleTrigger>
                  )}
                  
                  <CollapsibleContent>
                    <div>
                      <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">Instructions</h3>
                      <ol className="space-y-4">
                        {group.instructions.map((step, i) => (
                          <li key={i} className="flex gap-4" data-testid={`instruction-${groupIndex}-${i}`}>
                            <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-muted text-muted-foreground flex items-center justify-center text-sm font-medium">
                              {i + 1}
                            </span>
                            <p className="pt-1.5 leading-relaxed">{step}</p>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>

            <div className="lg:sticky lg:top-32 lg:self-start space-y-4">
              <Card className="border border-border">
                <CardContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <span className="font-data text-lg font-semibold">{recipe.viewCount}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Views</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <ChefHat className="h-4 w-4 text-muted-foreground" />
                        <span className="font-data text-lg font-semibold">{recipe.cookCount}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Cooked</p>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4">
                    <p className="text-xs text-muted-foreground mb-2 text-center">Rate this recipe</p>
                    <div className="flex justify-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => rateMutation.mutate(star)}
                          className="p-1"
                          data-testid={`button-rate-${star}`}
                        >
                          <Star 
                            className={`h-6 w-6 transition-colors ${
                              star <= (hoverRating || recipe.userRating || 0)
                                ? "fill-amber-400 text-amber-400"
                                : "text-muted-foreground"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    {recipe.averageRating !== null && (
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        <span className="font-data">{recipe.averageRating.toFixed(1)}</span> avg ({recipe.ratingCount} ratings)
                      </p>
                    )}
                  </div>

                  <Button 
                    onClick={() => cookMutation.mutate()}
                    disabled={!recipe.canCookAgain || cookMutation.isPending}
                    className="w-full gap-2"
                    variant={recipe.canCookAgain ? "default" : "secondary"}
                    data-testid="button-mark-cooked"
                  >
                    <ChefHat className="h-4 w-4" />
                    {recipe.canCookAgain ? "I Made This!" : "Cooked Today"}
                  </Button>
                </CardContent>
              </Card>

              {recipe.isPublic && (
                <Card className="border border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Comments ({recipe.commentCount})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-4">
                    <div className="flex gap-3">
                      <Textarea
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="min-h-[80px]"
                        data-testid="input-comment"
                      />
                    </div>
                    <Button 
                      onClick={() => commentMutation.mutate()}
                      disabled={!newComment.trim() || commentMutation.isPending}
                      className="gap-2"
                      data-testid="button-post-comment"
                    >
                      <Send className="h-4 w-4" />
                      Post Comment
                    </Button>

                    {commentsLoading ? (
                      <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="flex gap-3">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <div className="flex-1">
                              <Skeleton className="h-4 w-24 mb-2" />
                              <Skeleton className="h-12 w-full" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : comments.length === 0 ? (
                      <p className="text-muted-foreground text-sm text-center py-4">
                        No comments yet. Be the first to comment!
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {comments.map((comment) => (
                          <div 
                            key={comment.id} 
                            className={`flex gap-3 ${comment.isHidden ? "opacity-50" : ""}`}
                            data-testid={`comment-${comment.id}`}
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={comment.userProfileImageUrl || undefined} />
                              <AvatarFallback className="text-xs">
                                {(comment.userFirstName?.[0] || "") + (comment.userLastName?.[0] || "")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">
                                  {comment.userFirstName} {comment.userLastName}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                </span>
                                {comment.isHidden && (
                                  <Badge variant="outline" className="text-xs">Hidden</Badge>
                                )}
                              </div>
                              <p className="text-sm">{comment.content}</p>
                              {isOwner && !comment.isHidden && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-muted-foreground mt-1 h-6 px-2"
                                  onClick={() => hideCommentMutation.mutate(comment.id)}
                                  data-testid={`button-hide-comment-${comment.id}`}
                                >
                                  <EyeOff className="h-3 w-3 mr-1" />
                                  Hide
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      <RecipeEditDrawer 
        recipe={recipe} 
        open={editDrawerOpen} 
        onOpenChange={setEditDrawerOpen} 
      />
    </div>
  );
}
