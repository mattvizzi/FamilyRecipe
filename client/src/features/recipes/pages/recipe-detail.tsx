import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SEO } from "@/components/seo";
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
  Form,
  FormControl,
  FormField,
  FormItem,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  X,
  Check,
  Loader2,
  Upload,
  Sparkles,
  Camera,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { scaleAmount } from "@shared/lib/fraction";
import { abbreviateUnit } from "@/lib/units";
import type { RecipeWithStats, Family, CommentWithUser } from "@shared/schema";
import { recipeCategories } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

const ingredientSchema = z.object({
  name: z.string().min(1, "Required"),
  amount: z.string().min(1, "Required"),
  unit: z.string(),
});

const recipeGroupSchema = z.object({
  name: z.string().min(1, "Required"),
  ingredients: z.array(ingredientSchema).min(1, "Add at least one ingredient"),
  instructions: z.array(z.string().min(1)).min(1, "Add at least one instruction"),
});

const formSchema = z.object({
  name: z.string().min(1, "Recipe name is required"),
  category: z.string().min(1, "Category is required"),
  prepTime: z.coerce.number().min(0).optional().nullable(),
  cookTime: z.coerce.number().min(0).optional().nullable(),
  servings: z.coerce.number().min(1).default(4),
  groups: z.array(recipeGroupSchema).min(1, "Add at least one recipe section"),
});

type FormValues = z.infer<typeof formSchema>;

export default function RecipeDetail() {
  const [, params] = useRoute("/recipe/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const recipeId = params?.id;

  const [scale, setScale] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set([0]));
  const [newComment, setNewComment] = useState("");
  const [hoverRating, setHoverRating] = useState(0);
  const imageInputRef = useRef<HTMLInputElement>(null);

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

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      category: "",
      prepTime: null,
      cookTime: null,
      servings: 4,
      groups: [],
    },
  });

  useEffect(() => {
    if (recipe && isEditing) {
      form.reset({
        name: recipe.name,
        category: recipe.category,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        servings: recipe.servings || 4,
        groups: recipe.groups.map((g) => ({
          name: g.name,
          ingredients: g.ingredients.map((ing) => ({
            name: ing.name,
            amount: ing.amount,
            unit: ing.unit,
          })),
          instructions: [...g.instructions],
        })),
      });
    }
  }, [recipe, isEditing, form]);

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
      ...(recipe.imageUrl ? { image: recipe.imageUrl } : {}),
    };

    const cleanJsonLd = JSON.parse(JSON.stringify(jsonLd));

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "recipe-jsonld";
    script.textContent = JSON.stringify(cleanJsonLd);

    const existing = document.getElementById("recipe-jsonld");
    if (existing) existing.remove();

    document.head.appendChild(script);

    document.title = `${recipe.name} | Family Recipe Book`;
    
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.setAttribute("name", "description");
      document.head.appendChild(metaDesc);
    }
    const seoDescription = recipe.metaDescription || 
      `${recipe.name} - ${recipe.category} recipe. ${totalTime > 0 ? `Ready in ${totalTime} minutes.` : ""} Serves ${recipe.servings}.`;
    metaDesc.setAttribute("content", seoDescription);

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

  const updateMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return apiRequest("PATCH", `/api/recipes/${recipeId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes", recipeId, "stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      setIsEditing(false);
      toast({ title: "Saved", description: "Recipe updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update recipe", variant: "destructive" });
    },
  });

  const regenerateImageMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/recipes/${recipeId}/regenerate-image`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes", recipeId, "stats"] });
      toast({ title: "Image Regenerated", description: "New photo has been generated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to regenerate image", variant: "destructive" });
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: async (imageData: string) => {
      return apiRequest("POST", `/api/recipes/${recipeId}/upload-image`, { imageData });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes", recipeId, "stats"] });
      toast({ title: "Image Uploaded", description: "Your photo has been saved" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to upload image", variant: "destructive" });
    },
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Error", description: "Please select an image file", variant: "destructive" });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Error", description: "Image must be less than 10MB", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      uploadImageMutation.mutate(base64);
    };
    reader.readAsDataURL(file);
    
    // Reset input
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

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

  const startEditing = () => {
    if (recipe) {
      form.reset({
        name: recipe.name,
        category: recipe.category,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        servings: recipe.servings || 4,
        groups: recipe.groups.map((g) => ({
          name: g.name,
          ingredients: g.ingredients.map((ing) => ({
            name: ing.name,
            amount: ing.amount,
            unit: ing.unit,
          })),
          instructions: [...g.instructions],
        })),
      });
      setIsEditing(true);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    form.reset();
  };

  const onSubmit = (values: FormValues) => {
    updateMutation.mutate(values);
  };

  const onFormError = () => {
    const errors = form.formState.errors;
    let message = "Please fix the following errors: ";
    if (errors.name) message += "Recipe name is required. ";
    if (errors.category) message += "Category is required. ";
    if (errors.groups) message += "Check your ingredients and instructions. ";
    toast({ title: "Validation Error", description: message.trim(), variant: "destructive" });
  };

  const addIngredient = (groupIndex: number) => {
    const groups = form.getValues("groups");
    const newGroups = groups.map((group, i) => 
      i === groupIndex 
        ? { ...group, ingredients: [...group.ingredients, { name: "", amount: "", unit: "" }] }
        : group
    );
    form.setValue("groups", newGroups, { shouldDirty: true });
  };

  const removeIngredient = (groupIndex: number, ingredientIndex: number) => {
    const groups = form.getValues("groups");
    if (groups[groupIndex].ingredients.length > 1) {
      const newGroups = groups.map((group, i) => 
        i === groupIndex 
          ? { ...group, ingredients: group.ingredients.filter((_, j) => j !== ingredientIndex) }
          : group
      );
      form.setValue("groups", newGroups, { shouldDirty: true });
    }
  };

  const addInstruction = (groupIndex: number) => {
    const groups = form.getValues("groups");
    const newGroups = groups.map((group, i) => 
      i === groupIndex 
        ? { ...group, instructions: [...group.instructions, ""] }
        : group
    );
    form.setValue("groups", newGroups, { shouldDirty: true });
  };

  const removeInstruction = (groupIndex: number, instructionIndex: number) => {
    const groups = form.getValues("groups");
    if (groups[groupIndex].instructions.length > 1) {
      const newGroups = groups.map((group, i) => 
        i === groupIndex 
          ? { ...group, instructions: group.instructions.filter((_, j) => j !== instructionIndex) }
          : group
      );
      form.setValue("groups", newGroups, { shouldDirty: true });
    }
  };

  const addGroup = () => {
    const groups = form.getValues("groups");
    form.setValue("groups", [
      ...groups,
      {
        name: `Section ${groups.length + 1}`,
        ingredients: [{ name: "", amount: "", unit: "" }],
        instructions: [""],
      },
    ], { shouldDirty: true });
  };

  const removeGroup = (index: number) => {
    const groups = form.getValues("groups");
    if (groups.length > 1) {
      form.setValue("groups", groups.filter((_, i) => i !== index), { shouldDirty: true });
    }
  };

  const groups = form.watch("groups");

  if (isLoading) {
    return (
      <main className="pt-20 sm:pt-28 px-4 sm:px-6">
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
      <main className="pt-20 sm:pt-28 px-4 sm:px-6">
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
    <main className="pt-16 sm:pt-20 pb-12">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, onFormError)}>
        <div className="max-w-4xl mx-auto">
          {/* Hero Image - Full Width */}
          <div className="relative">
            {recipe.imageUrl ? (
              <div className="aspect-[16/9] sm:aspect-[21/9] w-full overflow-hidden">
                <img 
                  src={recipe.imageUrl} 
                  alt={recipe.imageAltText || recipe.name}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-[16/9] sm:aspect-[21/9] w-full bg-muted flex items-center justify-center text-muted-foreground">
                <ImageOff className="h-16 w-16" />
              </div>
            )}
            
            {/* Overlay Back Button */}
            <Button 
              variant="outline"
              size="sm"
              type="button"
              className="absolute top-4 left-4 bg-background border border-border"
              onClick={() => {
                if (isEditing) {
                  cancelEditing();
                } else if (window.history.length > 1) {
                  window.history.back();
                } else {
                  navigate("/my-recipes");
                }
              }}
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {isEditing ? "Cancel" : "Back"}
            </Button>

            {/* Image Edit Controls - show when editing */}
            {isEditing && (
              <div className="absolute bottom-4 right-4 flex gap-2">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  data-testid="input-recipe-image"
                />
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  className="bg-background border border-border"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploadImageMutation.isPending}
                  data-testid="button-upload-image"
                >
                  {uploadImageMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Upload Photo
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  className="bg-background border border-border"
                  onClick={() => regenerateImageMutation.mutate()}
                  disabled={regenerateImageMutation.isPending}
                  data-testid="button-regenerate-image"
                >
                  {regenerateImageMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Generate with AI
                </Button>
              </div>
            )}
          </div>

          {/* Floating Edit Mode Bar */}
          {isEditing && (
            <div className="sticky top-16 z-50 bg-background/95 backdrop-blur border-b border-border px-4 py-3 -mx-4 sm:-mx-6 sm:px-6">
              <div className="flex items-center justify-between gap-4 max-w-4xl mx-auto">
                <div className="flex items-center gap-2">
                  <Pencil className="h-4 w-4 text-primary" />
                  <span className="font-medium">Editing Recipe</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={cancelEditing}
                    data-testid="button-cancel-edit"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    type="submit"
                    disabled={updateMutation.isPending}
                    data-testid="button-save-edit"
                  >
                    {updateMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Content Area */}
          <div className="px-4 sm:px-6">
            {/* Title and Primary Actions Row */}
            <div className="flex items-start justify-between gap-4 pt-6 pb-4">
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="mb-2">
                        <FormControl>
                          <Input 
                            {...field} 
                            className="text-2xl md:text-3xl font-bold h-auto py-1 px-2 -mx-2"
                            placeholder="Recipe name"
                            data-testid="input-edit-name" 
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                ) : (
                  <h1 className="text-2xl md:text-3xl font-bold mb-2" data-testid="text-recipe-name">
                    {recipe.name}
                  </h1>
                )}
                
                {/* Metadata Row - Category, Visibility, Times */}
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  {isEditing ? (
                    <>
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-7 text-xs w-auto min-w-[100px]" data-testid="select-edit-category">
                                  <SelectValue placeholder="Category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {recipeCategories.map((cat) => (
                                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <FormField
                          control={form.control}
                          name="prepTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input 
                                  type="number"
                                  inputMode="numeric"
                                  min={0}
                                  placeholder="Prep"
                                  className="h-7 w-16 text-xs"
                                  {...field}
                                  value={field.value ?? ""}
                                  data-testid="input-edit-prep"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <span className="text-xs">+</span>
                        <FormField
                          control={form.control}
                          name="cookTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input 
                                  type="number"
                                  inputMode="numeric"
                                  min={0}
                                  placeholder="Cook"
                                  className="h-7 w-16 text-xs"
                                  {...field}
                                  value={field.value ?? ""}
                                  data-testid="input-edit-cook"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <span className="text-xs">min</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        <FormField
                          control={form.control}
                          name="servings"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input 
                                  type="number"
                                  inputMode="numeric"
                                  min={1}
                                  className="h-7 w-14 text-xs"
                                  {...field}
                                  data-testid="input-edit-servings"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <span className="text-xs">servings</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <Badge variant="secondary" data-testid="badge-category">
                        {recipe.category}
                      </Badge>
                      {isOwner && recipe.isPublic && (
                        <Badge variant="success" className="gap-1" data-testid="badge-public">
                          <Globe className="h-3 w-3" />
                          Public
                        </Badge>
                      )}
                      <span className="text-muted-foreground">
                        {((recipe.prepTime || 0) + (recipe.cookTime || 0)) > 0 && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            <span className="font-data">{(recipe.prepTime || 0) + (recipe.cookTime || 0)}m</span>
                          </span>
                        )}
                      </span>
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        <span className="font-data">{Math.round((recipe.servings || 4) * scale)}</span> servings
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Primary Actions - Compact (hide when editing) */}
              {!isEditing && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  {!isOwner && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          type="button"
                          onClick={() => saveMutation.mutate()}
                          disabled={saveMutation.isPending}
                          data-testid="button-save"
                          aria-label={recipe.isSaved ? "Remove from saved recipes" : "Save recipe"}
                        >
                          <Bookmark className={`h-4 w-4 ${recipe.isSaved ? "fill-current" : ""}`} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{recipe.isSaved ? "Remove from saved" : "Save recipe"}</TooltipContent>
                    </Tooltip>
                  )}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" type="button" onClick={copyToClipboard} data-testid="button-copy" aria-label="Copy recipe to clipboard">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copy to clipboard</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" type="button" onClick={exportToPDF} data-testid="button-export-pdf" aria-label="Export recipe as PDF">
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
                          type="button"
                          onClick={() => visibilityMutation.mutate(!recipe.isPublic)}
                          disabled={visibilityMutation.isPending}
                          data-testid="button-visibility"
                          aria-label={recipe.isPublic ? "Make recipe private" : "Make recipe public"}
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
                        <Button variant="ghost" size="icon" type="button" onClick={startEditing} data-testid="button-edit" aria-label="Edit recipe">
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
                            <Button variant="ghost" size="icon" type="button" data-testid="button-delete" aria-label="Delete recipe">
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
              )}
            </div>

            {/* Rating and "I Made This" Row (hide when editing) */}
            {!isEditing && (
              <div className="flex flex-wrap items-center gap-4 pb-6 border-b border-border">
                <div className="flex items-center gap-0">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => rateMutation.mutate(star)}
                      className="p-3 -m-2"
                      aria-label={`Rate ${star} stars`}
                      data-testid={`button-rate-${star}`}
                    >
                      <Star 
                        className={`h-5 w-5 transition-colors ${
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
                    <span className="text-xs text-muted-foreground ml-2">
                      ({recipe.ratingCount})
                    </span>
                  )}
                </div>
                
                <Button 
                  type="button"
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
            )}

            {/* Recipe Content */}
            <div className="space-y-8 pt-6">
              {isEditing ? (
                /* Edit Mode Content */
                <>
                  {groups.map((group, groupIndex) => (
                    <Card key={groupIndex}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                          <FormField
                            control={form.control}
                            name={`groups.${groupIndex}.name`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormControl>
                                  <Input 
                                    placeholder="Section name" 
                                    className="font-semibold"
                                    {...field} 
                                    data-testid={`input-group-name-${groupIndex}`}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          {groups.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeGroup(groupIndex)}
                              data-testid={`button-remove-group-${groupIndex}`}
                            >
                              <Trash2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-6">
                        {/* Ingredients Section */}
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-2">Ingredients</p>
                          <Table>
                            <TableBody>
                              {group.ingredients.map((_, ingIndex) => (
                                <TableRow 
                                  key={ingIndex}
                                  className={ingIndex % 2 === 0 ? "bg-muted/30 border-0" : "border-0"}
                                >
                                  <TableCell className="w-20 py-1.5 px-2">
                                    <FormField
                                      control={form.control}
                                      name={`groups.${groupIndex}.ingredients.${ingIndex}.amount`}
                                      render={({ field }) => (
                                        <FormControl>
                                          <Input 
                                            placeholder="Amt" 
                                            className="h-8 text-sm"
                                            {...field} 
                                            data-testid={`input-ing-amount-${groupIndex}-${ingIndex}`}
                                          />
                                        </FormControl>
                                      )}
                                    />
                                  </TableCell>
                                  <TableCell className="w-20 py-1.5 px-2">
                                    <FormField
                                      control={form.control}
                                      name={`groups.${groupIndex}.ingredients.${ingIndex}.unit`}
                                      render={({ field }) => (
                                        <FormControl>
                                          <Input 
                                            placeholder="Unit" 
                                            className="h-8 text-sm"
                                            {...field} 
                                            data-testid={`input-ing-unit-${groupIndex}-${ingIndex}`}
                                          />
                                        </FormControl>
                                      )}
                                    />
                                  </TableCell>
                                  <TableCell className="py-1.5 px-2">
                                    <FormField
                                      control={form.control}
                                      name={`groups.${groupIndex}.ingredients.${ingIndex}.name`}
                                      render={({ field }) => (
                                        <FormControl>
                                          <Input 
                                            placeholder="Ingredient name" 
                                            className="h-8 text-sm"
                                            {...field} 
                                            data-testid={`input-ing-name-${groupIndex}-${ingIndex}`}
                                          />
                                        </FormControl>
                                      )}
                                    />
                                  </TableCell>
                                  <TableCell className="w-10 py-1.5 px-1">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => removeIngredient(groupIndex, ingIndex)}
                                      disabled={group.ingredients.length <= 1}
                                      data-testid={`button-remove-ing-${groupIndex}-${ingIndex}`}
                                    >
                                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                              <TableRow className="border-0 bg-transparent">
                                <TableCell colSpan={4} className="py-1.5 px-2">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="w-full text-muted-foreground"
                                    onClick={() => addIngredient(groupIndex)}
                                    data-testid={`button-add-ing-${groupIndex}`}
                                  >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add ingredient
                                  </Button>
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>

                        {/* Instructions Section */}
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-2">Instructions</p>
                          <Table>
                            <TableBody>
                              {group.instructions.map((_, instIndex) => (
                                <TableRow 
                                  key={instIndex}
                                  className={instIndex % 2 === 0 ? "bg-muted/30 border-0" : "border-0"}
                                >
                                  <TableCell className="w-10 py-2 px-2 align-top">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                                      {instIndex + 1}
                                    </span>
                                  </TableCell>
                                  <TableCell className="py-2 px-2">
                                    <FormField
                                      control={form.control}
                                      name={`groups.${groupIndex}.instructions.${instIndex}`}
                                      render={({ field }) => (
                                        <FormControl>
                                          <Textarea 
                                            placeholder="Instruction step" 
                                            className="min-h-[60px] text-sm" 
                                            {...field} 
                                            data-testid={`input-inst-${groupIndex}-${instIndex}`}
                                          />
                                        </FormControl>
                                      )}
                                    />
                                  </TableCell>
                                  <TableCell className="w-10 py-2 px-1 align-top">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => removeInstruction(groupIndex, instIndex)}
                                      disabled={group.instructions.length <= 1}
                                      data-testid={`button-remove-inst-${groupIndex}-${instIndex}`}
                                    >
                                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                              <TableRow className="border-0 bg-transparent">
                                <TableCell colSpan={3} className="py-1.5 px-2">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="w-full text-muted-foreground"
                                    onClick={() => addInstruction(groupIndex)}
                                    data-testid={`button-add-inst-${groupIndex}`}
                                  >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add step
                                  </Button>
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={addGroup}
                    className="w-full"
                    data-testid="button-add-group"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Section
                  </Button>
                </>
              ) : (
                /* View Mode Content */
                <>
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-lg">Ingredients</CardTitle>
                        <div className="flex items-center gap-0.5 border border-border rounded-lg">
                          <Button
                            variant="ghost"
                            size="icon"
                            type="button"
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
                            type="button"
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
                                type="button"
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
                          type="button"
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
                                      type="button"
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
                </>
              )}
            </div>
          </div>
        </div>
          </form>
        </Form>
    </main>
  );
}
