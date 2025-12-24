import { useState, useEffect, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Check, 
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
import type { RecipeWithCreator, Family, RecipeGroup, RecipeCategory } from "@shared/schema";
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

  const scaleOptions = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4];

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
        <main className="pt-16">
          <Skeleton className="w-full h-64" />
          <div className="max-w-4xl mx-auto px-6 -mt-12">
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-8 w-2/3 mb-4" />
                <div className="flex gap-4 mb-4">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-24" />
                </div>
                <Skeleton className="h-40 w-full" />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen bg-background">
        <Header family={family} />
        <main className="pt-24 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4">Recipe Not Found</h1>
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
      
      <main className="pt-16">
        <div className="relative h-64 bg-muted overflow-hidden">
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
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        <div className="max-w-4xl mx-auto px-6 -mt-12 relative z-10 pb-12">
          <Button 
            variant="outline" 
            size="sm" 
            className="mb-4 bg-background/80 backdrop-blur-sm"
            onClick={() => navigate("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <Card>
            <CardContent className="p-6">
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
                      className="text-2xl font-bold"
                      data-testid="input-recipe-name"
                    />
                  ) : (
                    <h1 
                      className="text-2xl font-bold cursor-pointer hover:text-primary inline-flex items-center gap-2 group"
                      onClick={() => setEditingField("name")}
                      data-testid="text-recipe-name"
                    >
                      {recipe.name}
                      <Pencil className="h-4 w-4 opacity-0 group-hover:opacity-50 transition-opacity" />
                    </h1>
                  )}
                </div>
                <code className="text-xs text-muted-foreground font-mono" data-testid="text-recipe-id">
                  {recipe.id}
                </code>
              </div>

              <div className="flex flex-wrap items-center gap-4 mb-6">
                {editingField === "category" ? (
                  <Select
                    defaultValue={recipe.category}
                    onValueChange={(v) => handleSave("category", v)}
                  >
                    <SelectTrigger className="w-32">
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
                    className="cursor-pointer"
                    onClick={() => setEditingField("category")}
                    data-testid="badge-category"
                  >
                    {recipe.category}
                  </Badge>
                )}

                {totalTime > 0 && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{totalTime} min</span>
                  </div>
                )}

                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{Math.round((recipe.servings || 4) * scale)} servings</span>
                </div>

                {recipe.creatorFirstName && (
                  <span className="text-sm text-muted-foreground">
                    Added by {recipe.creatorFirstName} {recipe.creatorLastName}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 p-3 bg-muted rounded-lg mb-6">
                <span className="text-sm font-medium mr-2">Scale:</span>
                {scaleOptions.map((s) => (
                  <Button
                    key={s}
                    variant={scale === s ? "default" : "outline"}
                    size="sm"
                    onClick={() => setScale(s)}
                    data-testid={`button-scale-${s}`}
                  >
                    {s}x
                  </Button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                <Button variant="outline" size="sm" onClick={copyToClipboard} data-testid="button-copy">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button variant="outline" size="sm" onClick={exportToPDF} data-testid="button-export-pdf">
                  <FileDown className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" data-testid="button-delete">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
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
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

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
                        className="w-full justify-between mb-4 border-l-4 border-primary pl-4"
                        data-testid={`button-group-${groupIndex}`}
                      >
                        <span className="font-semibold">{group.name}</span>
                        <ChevronDown className={`h-5 w-5 transition-transform ${expandedGroups.has(groupIndex) ? "rotate-180" : ""}`} />
                      </Button>
                    </CollapsibleTrigger>
                  )}
                  
                  <CollapsibleContent className="space-y-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Ingredients</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {group.ingredients.map((ingredient, i) => {
                            const scaledAmount = scaleAmount(ingredient.amount, scale);
                            return (
                              <li key={i} className="flex items-baseline gap-2" data-testid={`ingredient-${groupIndex}-${i}`}>
                                <span className="font-medium min-w-[3rem] text-right">{scaledAmount}</span>
                                <span className="text-muted-foreground min-w-[3rem]">{ingredient.unit}</span>
                                <span>{ingredient.name}</span>
                              </li>
                            );
                          })}
                        </ul>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Instructions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ol className="space-y-4">
                          {group.instructions.map((step, i) => (
                            <li key={i} className="flex gap-4" data-testid={`instruction-${groupIndex}-${i}`}>
                              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium text-sm">
                                {i + 1}
                              </span>
                              <p className="pt-1">{step}</p>
                            </li>
                          ))}
                        </ol>
                      </CardContent>
                    </Card>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
