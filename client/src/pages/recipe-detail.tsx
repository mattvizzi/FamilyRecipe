import { useState, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import type { RecipeWithCreator, Family, RecipeCategory } from "@shared/schema";
import { recipeCategories } from "@shared/schema";

export default function RecipeDetail() {
  const [, params] = useRoute("/recipe/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const recipeId = params?.id;

  const [scale, setScale] = useState(1);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set([0]));

  const { data: family } = useQuery<Family>({
    queryKey: ["/api/family"],
  });

  const { data: recipe, isLoading } = useQuery<RecipeWithCreator>({
    queryKey: ["/api/recipes", recipeId],
    enabled: !!recipeId,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<RecipeWithCreator>) => {
      return apiRequest("PATCH", `/api/recipes/${recipeId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes", recipeId] });
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      setEditingField(null);
      toast({ title: "Saved", description: "Recipe updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update recipe", variant: "destructive" });
    },
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

  const handleSave = useCallback((field: string, value: unknown) => {
    updateMutation.mutate({ [field]: value });
  }, [updateMutation]);

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
        <main className="pt-20 px-8">
          <div className="max-w-7xl mx-auto">
            <Skeleton className="h-8 w-24 mb-6" />
            <div className="grid lg:grid-cols-[1fr,400px] gap-8">
              <div>
                <Skeleton className="aspect-video rounded-2xl mb-6" />
                <Skeleton className="h-10 w-2/3 mb-4" />
                <div className="flex gap-3 mb-6">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>
              <div>
                <Skeleton className="h-64 rounded-2xl" />
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
        <main className="pt-28 px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4 headline">Recipe Not Found</h1>
            <Button asChild className="rounded-full px-6">
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
      
      <main className="pt-20 px-8 pb-16">
        <div className="max-w-7xl mx-auto">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mb-6 -ml-2 rounded-full"
            onClick={() => navigate("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to recipes
          </Button>

          <div className="grid lg:grid-cols-[1fr,380px] gap-10">
            <div className="space-y-8">
              <div className="relative rounded-2xl overflow-hidden bg-muted aspect-video group">
                {recipe.imageUrl ? (
                  <img 
                    src={recipe.imageUrl} 
                    alt={recipe.name}
                    className="w-full h-full object-cover img-zoom"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    No Image
                  </div>
                )}
                <div className="gradient-overlay opacity-50" />
              </div>

              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    {editingField === "name" ? (
                      <Input
                        defaultValue={recipe.name}
                        autoFocus
                        onBlur={(e) => handleSave("name", e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleSave("name", e.currentTarget.value);
                          } else if (e.key === "Escape") {
                            setEditingField(null);
                          }
                        }}
                        className="text-3xl font-bold h-auto py-2 rounded-xl"
                        data-testid="input-recipe-name"
                      />
                    ) : (
                      <h1 
                        className="text-3xl md:text-4xl headline cursor-pointer hover:text-primary/80 inline-flex items-center gap-3 group transition-colors"
                        onClick={() => setEditingField("name")}
                        data-testid="text-recipe-name"
                      >
                        {recipe.name}
                        <Pencil className="h-5 w-5 opacity-0 group-hover:opacity-50 transition-opacity" />
                      </h1>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 mb-6">
                  {editingField === "category" ? (
                    <Select
                      defaultValue={recipe.category}
                      onValueChange={(v) => handleSave("category", v)}
                    >
                      <SelectTrigger className="w-36 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {recipeCategories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge 
                      variant="secondary" 
                      className="cursor-pointer text-sm px-4 py-1"
                      onClick={() => setEditingField("category")}
                      data-testid="badge-category"
                    >
                      {recipe.category}
                    </Badge>
                  )}

                  {totalTime > 0 && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{totalTime} min</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{Math.round((recipe.servings || 4) * scale)} servings</span>
                  </div>

                  <code className="text-xs text-muted-foreground font-mono ml-auto" data-testid="text-recipe-id">
                    #{recipe.id}
                  </code>
                </div>

                {recipe.creatorFirstName && (
                  <p className="label-meta mb-8">
                    Added by {recipe.creatorFirstName} {recipe.creatorLastName}
                  </p>
                )}

                {recipe.groups.map((group, groupIndex) => (
                  <Collapsible
                    key={groupIndex}
                    open={expandedGroups.has(groupIndex)}
                    onOpenChange={() => toggleGroup(groupIndex)}
                    className="mb-8"
                  >
                    {recipe.groups.length > 1 && (
                      <CollapsibleTrigger asChild>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-between mb-4 h-12 rounded-xl bg-muted/50"
                          data-testid={`button-group-${groupIndex}`}
                        >
                          <span className="font-semibold text-lg">{group.name}</span>
                          <ChevronDown className={`h-5 w-5 transition-transform duration-300 ${expandedGroups.has(groupIndex) ? "rotate-180" : ""}`} />
                        </Button>
                      </CollapsibleTrigger>
                    )}
                    
                    <CollapsibleContent className="space-y-8">
                      <div>
                        <h3 className="label-meta mb-4">Instructions</h3>
                        <ol className="space-y-6">
                          {group.instructions.map((step, i) => (
                            <li key={i} className="flex gap-5" data-testid={`instruction-${groupIndex}-${i}`}>
                              <span className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-semibold">
                                {i + 1}
                              </span>
                              <p className="pt-2 text-lg leading-relaxed">{step}</p>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </div>

            <div className="lg:sticky lg:top-24 lg:self-start space-y-6">
              <Card className="premium-card border-0 overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg headline">Ingredients</CardTitle>
                    <div className="flex items-center gap-1 glass-panel rounded-full px-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => setScale(Math.max(0.5, scale - 0.5))}
                        disabled={scale <= 0.5}
                        data-testid="button-scale-down"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-12 text-center font-medium">{scale}x</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => setScale(Math.min(4, scale + 0.5))}
                        disabled={scale >= 4}
                        data-testid="button-scale-up"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {recipe.groups.map((group, groupIndex) => (
                    <div key={groupIndex} className={groupIndex > 0 ? "mt-6 pt-6 border-t" : ""}>
                      {recipe.groups.length > 1 && (
                        <p className="label-meta mb-3">{group.name}</p>
                      )}
                      <ul className="space-y-3">
                        {group.ingredients.map((ingredient, i) => {
                          const scaledAmount = scaleAmount(ingredient.amount, scale);
                          return (
                            <li key={i} className="flex items-baseline gap-3" data-testid={`ingredient-${groupIndex}-${i}`}>
                              <span className="font-semibold min-w-[2.5rem] text-right text-primary">{scaledAmount}</span>
                              <span className="text-muted-foreground min-w-[3rem]">{ingredient.unit}</span>
                              <span>{ingredient.name}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="flex flex-wrap gap-3">
                <Button variant="outline" className="flex-1 rounded-xl h-11" onClick={copyToClipboard} data-testid="button-copy">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button variant="outline" className="flex-1 rounded-xl h-11" onClick={exportToPDF} data-testid="button-export-pdf">
                  <FileDown className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full text-muted-foreground hover:text-destructive rounded-xl" data-testid="button-delete">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Recipe
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="headline">Delete Recipe?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete "{recipe.name}".
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => deleteMutation.mutate()}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
