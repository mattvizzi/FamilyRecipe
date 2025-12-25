import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { RecipeEditDrawer } from "@/components/recipe-edit-drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  ImageOff,
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

  // JSON-LD structured data for SEO
  useEffect(() => {
    if (!recipe) return;

    const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
    const allIngredients = recipe.groups.flatMap(g => 
      g.ingredients.map(i => `${i.amount} ${i.unit} ${i.name}`.trim())
    );
    const allInstructions = recipe.groups.flatMap(g => g.instructions);

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Recipe",
      name: recipe.name,
      author: {
        "@type": "Person",
        name: `${recipe.creatorFirstName || ""} ${recipe.creatorLastName || ""}`.trim() || "Family Member",
      },
      datePublished: recipe.createdAt,
      description: `${recipe.name} - A family recipe in the ${recipe.category} category`,
      prepTime: recipe.prepTime ? `PT${recipe.prepTime}M` : undefined,
      cookTime: recipe.cookTime ? `PT${recipe.cookTime}M` : undefined,
      totalTime: totalTime > 0 ? `PT${totalTime}M` : undefined,
      recipeYield: `${recipe.servings} servings`,
      recipeCategory: recipe.category,
      recipeIngredient: allIngredients,
      recipeInstructions: allInstructions.map((step, idx) => ({
        "@type": "HowToStep",
        position: idx + 1,
        text: step,
      })),
      ...(recipe.averageRating && recipe.ratingCount && recipe.ratingCount > 0 ? {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: recipe.averageRating.toFixed(1),
          ratingCount: recipe.ratingCount,
          bestRating: 5,
          worstRating: 1,
        },
      } : {}),
      ...(recipe.image ? { image: recipe.image } : {}),
    };

    // Remove undefined values
    const cleanJsonLd = JSON.parse(JSON.stringify(jsonLd));

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "recipe-jsonld";
    script.textContent = JSON.stringify(cleanJsonLd);

    // Remove existing script if any
    const existing = document.getElementById("recipe-jsonld");
    if (existing) existing.remove();

    document.head.appendChild(script);

    // Update document title and meta description
    document.title = `${recipe.name} | Family Recipe Book`;
    
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.setAttribute("name", "description");
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute("content", 
      `${recipe.name} - ${recipe.category} recipe. ${totalTime > 0 ? `Ready in ${totalTime} minutes.` : ""} Serves ${recipe.servings}.`
    );

    // Add canonical URL to prevent duplicate content issues
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", `${window.location.origin}/recipe/${recipeId}`);

    return () => {
      const el = document.getElementById("recipe-jsonld");
      if (el) el.remove();
    };
  }, [recipe, recipeId]);

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
      <main className="pt-20 px-6">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-24 mb-6" />
          <Skeleton className="h-10 w-2/3 mb-4" />
          <div className="flex gap-2 mb-6">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-20" />
          </div>
          <Skeleton className="w-full aspect-video rounded-lg mb-8" />
          <Skeleton className="h-64" />
        </div>
      </main>
    );
  }

  if (!recipe) {
    return (
      <main className="pt-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-xl font-bold mb-4">Recipe Not Found</h1>
          <Button asChild>
            <a href="/my-recipes">Go Back Home</a>
          </Button>
        </div>
      </main>
    );
  }

  const isOwner = recipe.createdById === user?.id;

  return (
    <main className="pt-20 pb-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                if (window.history.length > 1) {
                  window.history.back();
                } else {
                  navigate("/my-recipes");
                }
              }}
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            <div className="flex items-center gap-2">
              {!isOwner && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => saveMutation.mutate()}
                      disabled={saveMutation.isPending}
                      data-testid="button-save"
                    >
                      <Bookmark className={`h-4 w-4 ${recipe.isSaved ? "fill-current" : ""}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{recipe.isSaved ? "Remove from saved" : "Save recipe"}</TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={copyToClipboard} data-testid="button-copy">
                    <Copy className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy to clipboard</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={exportToPDF} data-testid="button-export-pdf">
                    <FileDown className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Export as PDF</TooltipContent>
              </Tooltip>
              {isOwner && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost"
                      size="icon" 
                      onClick={() => visibilityMutation.mutate(!recipe.isPublic)}
                      disabled={visibilityMutation.isPending}
                      data-testid="button-visibility"
                    >
                      {recipe.isPublic ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{recipe.isPublic ? "Make private" : "Make public"}</TooltipContent>
                </Tooltip>
              )}
              {isOwner && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => setEditDrawerOpen(true)} data-testid="button-edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Edit recipe</TooltipContent>
                </Tooltip>
              )}
              {isOwner && (
                <AlertDialog>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" data-testid="button-delete">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Delete recipe</TooltipContent>
                  </Tooltip>
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

          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold mb-4" data-testid="text-recipe-name">
              {recipe.name}
            </h1>
            
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge variant="secondary" data-testid="badge-category">
                {recipe.category}
              </Badge>
              {isOwner && recipe.isPublic && (
                <Badge variant="success" className="gap-1" data-testid="badge-public">
                  <Globe className="h-3 w-3" />
                  Public
                </Badge>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
              {(recipe.prepTime || 0) > 0 && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span className="font-data">{recipe.prepTime}m</span> prep
                </span>
              )}
              {(recipe.cookTime || 0) > 0 && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span className="font-data">{recipe.cookTime}m</span> cook
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                <span className="font-data">{Math.round((recipe.servings || 4) * scale)}</span> servings
              </span>
              
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => rateMutation.mutate(star)}
                    className="p-0.5"
                    data-testid={`button-rate-${star}`}
                  >
                    <Star 
                      className={`h-4 w-4 transition-colors ${
                        star <= (hoverRating || recipe.userRating || 0)
                          ? "fill-amber-400 text-amber-400"
                          : recipe.averageRating && star <= Math.round(recipe.averageRating)
                            ? "fill-amber-400/50 text-amber-400/50"
                            : "text-muted-foreground/40"
                      }`}
                    />
                  </button>
                ))}
                {recipe.ratingCount > 0 && (
                  <span className="text-xs text-muted-foreground ml-1">
                    ({recipe.ratingCount})
                  </span>
                )}
              </div>
              
              <Button 
                onClick={() => cookMutation.mutate()}
                disabled={!recipe.canCookAgain || cookMutation.isPending}
                size="sm"
                variant={recipe.canCookAgain ? "default" : "secondary"}
                data-testid="button-mark-cooked"
              >
                <ChefHat className="h-4 w-4 mr-1" />
                {recipe.canCookAgain ? "I Made This" : "Cooked"}
              </Button>
            </div>
          </div>

          {recipe.imageUrl && (
            <div className="rounded-lg overflow-hidden aspect-video mb-8">
              <img 
                src={recipe.imageUrl} 
                alt={recipe.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          {!recipe.imageUrl && (
            <div className="rounded-lg overflow-hidden aspect-video mb-8 bg-muted flex items-center justify-center text-muted-foreground">
              <ImageOff className="h-12 w-12" />
            </div>
          )}

          <div className="space-y-8">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-lg">Ingredients</CardTitle>
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
              </CardHeader>
              <CardContent className="pt-0">
                {recipe.groups.map((group, groupIndex) => (
                  <div key={groupIndex} className={groupIndex > 0 ? "mt-4 pt-4 border-t border-border" : ""}>
                    {recipe.groups.length > 1 && (
                      <p className="text-sm font-medium text-muted-foreground mb-2">{group.name}</p>
                    )}
                    <Table>
                      <TableBody>
                        {group.ingredients.map((ingredient, i) => {
                          const scaledAmount = scaleAmount(ingredient.amount, scale);
                          return (
                            <TableRow 
                              key={i} 
                              className={i % 2 === 0 ? "bg-muted/30" : ""}
                              data-testid={`ingredient-${groupIndex}-${i}`}
                            >
                              <TableCell className="w-16 py-2 font-data font-medium text-primary whitespace-nowrap">
                                {scaledAmount}
                              </TableCell>
                              <TableCell className="w-20 py-2 text-muted-foreground whitespace-nowrap">
                                {abbreviateUnit(ingredient.unit)}
                              </TableCell>
                              <TableCell className="py-2">
                                {ingredient.name}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ))}
              </CardContent>
            </Card>

            {recipe.groups.map((group, groupIndex) => (
              <Card key={groupIndex}>
                <Collapsible
                  open={expandedGroups.has(groupIndex)}
                  onOpenChange={() => toggleGroup(groupIndex)}
                >
                  {recipe.groups.length > 1 ? (
                    <CardHeader className="pb-0">
                      <CollapsibleTrigger asChild>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-between h-10 -ml-4 -mr-4"
                          data-testid={`button-group-${groupIndex}`}
                        >
                          <span className="font-medium">{group.name}</span>
                          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${expandedGroups.has(groupIndex) ? "rotate-180" : ""}`} />
                        </Button>
                      </CollapsibleTrigger>
                    </CardHeader>
                  ) : (
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Instructions</CardTitle>
                    </CardHeader>
                  )}
                  
                  <CollapsibleContent>
                    <CardContent className={recipe.groups.length > 1 ? "pt-3" : "pt-0"}>
                      {recipe.groups.length > 1 && (
                        <p className="text-lg font-semibold mb-3">Instructions</p>
                      )}
                      <Table>
                        <TableBody>
                          {group.instructions.map((step, i) => (
                            <TableRow 
                              key={i} 
                              className={i % 2 === 0 ? "bg-muted/30 border-0" : "border-0"}
                              data-testid={`instruction-${groupIndex}-${i}`}
                            >
                              <TableCell className="w-12 py-3 align-top">
                                <span className="flex-shrink-0 w-7 h-7 rounded-md bg-primary/10 text-primary flex items-center justify-center text-sm font-data font-medium">
                                  {i + 1}
                                </span>
                              </TableCell>
                              <TableCell className="py-3 leading-relaxed">
                                {step}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))}

            {recipe.isPublic && (
              <div className="border-t border-border pt-8">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <MessageCircle className="h-5 w-5" />
                  Comments ({recipe.commentCount})
                </h3>
                
                <div className="space-y-4">
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
                    <div className="space-y-4 pt-4">
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
                    <div className="space-y-4 pt-4">
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
                </div>
              </div>
            )}
          </div>
        </div>

      <RecipeEditDrawer 
        recipe={recipe} 
        open={editDrawerOpen} 
        onOpenChange={setEditDrawerOpen} 
      />
    </main>
  );
}
