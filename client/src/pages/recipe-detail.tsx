import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { RecipeEditDrawer } from "@/components/recipe-edit-drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { scaleAmount } from "@/lib/fraction";
import { abbreviateUnit } from "@/lib/units";
import type { RecipeWithCreator, Family } from "@shared/schema";

export default function RecipeDetail() {
  const [, params] = useRoute("/recipe/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const recipeId = params?.id;

  const [scale, setScale] = useState(1);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set([0]));

  const { data: family } = useQuery<Family>({
    queryKey: ["/api/family"],
  });

  const { data: recipe, isLoading } = useQuery<RecipeWithCreator>({
    queryKey: ["/api/recipes", recipeId],
    enabled: !!recipeId,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/recipes/${recipeId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      navigate("/");
      toast({ title: "Deleted", description: "Recipe deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete recipe", variant: "destructive" });
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
          <div className="max-w-7xl mx-auto">
            <Skeleton className="h-8 w-24 mb-6" />
            <div className="grid lg:grid-cols-[1fr,380px] gap-10">
              <div>
                <Skeleton className="aspect-video rounded-lg mb-6" />
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
        <main className="pt-28 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-xl font-bold mb-4">Recipe Not Found</h1>
            <Button asChild>
              <a href="/">Go Back Home</a>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);

  return (
    <div className="min-h-screen bg-background">
      <Header family={family} />
      
      <div className="fixed top-16 left-0 right-0 z-40 bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-12 flex items-center justify-between gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setEditDrawerOpen(true)} data-testid="button-edit">
              <Pencil className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Edit</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={copyToClipboard} data-testid="button-copy">
              <Copy className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Copy</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={exportToPDF} data-testid="button-export-pdf">
              <FileDown className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-muted-foreground" data-testid="button-delete">
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
          </div>
        </div>
      </div>
      
      <main className="pt-32 px-6 pb-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-[1fr,380px] gap-10">
            <div className="space-y-6">
              <div className="rounded-lg overflow-hidden bg-muted aspect-video border border-border">
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

              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-4" data-testid="text-recipe-name">
                  {recipe.name}
                </h1>

                <div className="flex flex-wrap items-center gap-3 mb-5">
                  <Badge variant="secondary" className="text-xs" data-testid="badge-category">
                    {recipe.category}
                  </Badge>

                  {(recipe.prepTime || 0) > 0 && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground" data-testid="text-prep-time">
                      <Clock className="h-3.5 w-3.5" />
                      <span className="font-data">{recipe.prepTime}m prep</span>
                    </div>
                  )}

                  {(recipe.cookTime || 0) > 0 && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground" data-testid="text-cook-time">
                      <Clock className="h-3.5 w-3.5" />
                      <span className="font-data">{recipe.cookTime}m cook</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground" data-testid="text-servings">
                    <Users className="h-3.5 w-3.5" />
                    <span className="font-data">{Math.round((recipe.servings || 4) * scale)} servings</span>
                  </div>

                  <code className="text-xs text-muted-foreground font-data ml-auto" data-testid="text-recipe-id">
                    #{recipe.id}
                  </code>
                </div>

                {recipe.creatorFirstName && (
                  <p className="text-xs text-muted-foreground mb-6">
                    by {recipe.creatorFirstName} {recipe.creatorLastName}
                  </p>
                )}

                {recipe.groups.map((group, groupIndex) => (
                  <Collapsible
                    key={groupIndex}
                    open={expandedGroups.has(groupIndex)}
                    onOpenChange={() => toggleGroup(groupIndex)}
                    className="mb-6"
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
                    
                    <CollapsibleContent className="space-y-6">
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
            </div>

            <div className="lg:sticky lg:top-32 lg:self-start">
              <Card className="border border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base font-semibold">Ingredients</CardTitle>
                    <div className="flex items-center gap-0.5 border border-border rounded-lg">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
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
                        className="h-8 w-8"
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
                    <div key={groupIndex} className={groupIndex > 0 ? "mt-5 pt-5 border-t border-border" : ""}>
                      {recipe.groups.length > 1 && (
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">{group.name}</p>
                      )}
                      <table className="w-full text-sm">
                        <tbody>
                          {group.ingredients.map((ingredient, i) => {
                            const scaledAmount = scaleAmount(ingredient.amount, scale);
                            return (
                              <tr key={i} data-testid={`ingredient-${groupIndex}-${i}`}>
                                <td className="py-1 pr-2 text-right align-baseline w-12">
                                  <span className="font-data font-medium text-primary">{scaledAmount}</span>
                                </td>
                                <td className="py-1 pr-3 text-muted-foreground align-baseline w-14">
                                  {abbreviateUnit(ingredient.unit)}
                                </td>
                                <td className="py-1 align-baseline">{ingredient.name}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </CardContent>
              </Card>
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
