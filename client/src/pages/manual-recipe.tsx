import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
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
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Family } from "@shared/schema";
import { recipeCategories } from "@shared/schema";

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
  prepTime: z.coerce.number().min(0).optional(),
  cookTime: z.coerce.number().min(0).optional(),
  servings: z.coerce.number().min(1).default(4),
  groups: z.array(recipeGroupSchema).min(1, "Add at least one recipe section"),
});

type FormValues = z.infer<typeof formSchema>;

export default function ManualRecipe() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: family } = useQuery<Family>({
    queryKey: ["/api/family"],
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      category: "Dinner",
      prepTime: undefined,
      cookTime: undefined,
      servings: 4,
      groups: [
        {
          name: "Main",
          ingredients: [{ name: "", amount: "", unit: "" }],
          instructions: [""],
        },
      ],
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return apiRequest("POST", "/api/recipes", data);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      toast({ title: "Success", description: "Recipe created successfully" });
      navigate(`/recipe/${data.id}`);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create recipe", variant: "destructive" });
    },
  });

  const onSubmit = (values: FormValues) => {
    createMutation.mutate(values);
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
    ]);
  };

  const removeGroup = (index: number) => {
    const groups = form.getValues("groups");
    if (groups.length > 1) {
      form.setValue("groups", groups.filter((_, i) => i !== index));
    }
  };

  const addIngredient = (groupIndex: number) => {
    const groups = form.getValues("groups");
    groups[groupIndex].ingredients.push({ name: "", amount: "", unit: "" });
    form.setValue("groups", [...groups]);
  };

  const removeIngredient = (groupIndex: number, ingredientIndex: number) => {
    const groups = form.getValues("groups");
    if (groups[groupIndex].ingredients.length > 1) {
      groups[groupIndex].ingredients.splice(ingredientIndex, 1);
      form.setValue("groups", [...groups]);
    }
  };

  const addInstruction = (groupIndex: number) => {
    const groups = form.getValues("groups");
    groups[groupIndex].instructions.push("");
    form.setValue("groups", [...groups]);
  };

  const removeInstruction = (groupIndex: number, instructionIndex: number) => {
    const groups = form.getValues("groups");
    if (groups[groupIndex].instructions.length > 1) {
      groups[groupIndex].instructions.splice(instructionIndex, 1);
      form.setValue("groups", [...groups]);
    }
  };

  const groups = form.watch("groups");

  return (
    <div className="min-h-screen bg-background">
      <Header family={family} />
      
      <main className="pt-24 pb-12 px-6">
        <div className="max-w-3xl mx-auto">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mb-6"
            onClick={() => navigate("/add-recipe")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <h1 className="text-2xl font-bold mb-6">Add Recipe Manually</h1>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recipe Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Grandma's Chicken Soup" {...field} data-testid="input-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-category">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {recipeCategories.map((cat) => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="servings"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Servings</FormLabel>
                          <FormControl>
                            <Input type="number" min={1} {...field} data-testid="input-servings" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="prepTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prep Time (min)</FormLabel>
                          <FormControl>
                            <Input type="number" min={0} placeholder="Optional" {...field} data-testid="input-prep-time" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cookTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cook Time (min)</FormLabel>
                          <FormControl>
                            <Input type="number" min={0} placeholder="Optional" {...field} data-testid="input-cook-time" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {groups.map((group, groupIndex) => (
                <Card key={groupIndex}>
                  <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
                    <FormField
                      control={form.control}
                      name={`groups.${groupIndex}.name`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input 
                              placeholder="Section name (e.g., Meatballs)" 
                              {...field} 
                              data-testid={`input-group-name-${groupIndex}`}
                            />
                          </FormControl>
                          <FormMessage />
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
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="text-sm font-medium mb-3">Ingredients</h4>
                      <div className="space-y-2">
                        {group.ingredients.map((_, ingredientIndex) => (
                          <div key={ingredientIndex} className="flex gap-2">
                            <FormField
                              control={form.control}
                              name={`groups.${groupIndex}.ingredients.${ingredientIndex}.amount`}
                              render={({ field }) => (
                                <FormItem className="w-20">
                                  <FormControl>
                                    <Input placeholder="Amt" {...field} data-testid={`input-ingredient-amount-${groupIndex}-${ingredientIndex}`} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`groups.${groupIndex}.ingredients.${ingredientIndex}.unit`}
                              render={({ field }) => (
                                <FormItem className="w-20">
                                  <FormControl>
                                    <Input placeholder="Unit" {...field} data-testid={`input-ingredient-unit-${groupIndex}-${ingredientIndex}`} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`groups.${groupIndex}.ingredients.${ingredientIndex}.name`}
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormControl>
                                    <Input placeholder="Ingredient name" {...field} data-testid={`input-ingredient-name-${groupIndex}-${ingredientIndex}`} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            {group.ingredients.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeIngredient(groupIndex, ingredientIndex)}
                                data-testid={`button-remove-ingredient-${groupIndex}-${ingredientIndex}`}
                              >
                                <Trash2 className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => addIngredient(groupIndex)}
                        data-testid={`button-add-ingredient-${groupIndex}`}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Ingredient
                      </Button>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-3">Instructions</h4>
                      <div className="space-y-2">
                        {group.instructions.map((_, instructionIndex) => (
                          <div key={instructionIndex} className="flex gap-2">
                            <span className="flex-shrink-0 w-8 h-9 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                              {instructionIndex + 1}
                            </span>
                            <FormField
                              control={form.control}
                              name={`groups.${groupIndex}.instructions.${instructionIndex}`}
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormControl>
                                    <Textarea 
                                      placeholder="Describe this step..." 
                                      className="min-h-[80px]"
                                      {...field} 
                                      data-testid={`input-instruction-${groupIndex}-${instructionIndex}`}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            {group.instructions.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeInstruction(groupIndex, instructionIndex)}
                                data-testid={`button-remove-instruction-${groupIndex}-${instructionIndex}`}
                              >
                                <Trash2 className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => addInstruction(groupIndex)}
                        data-testid={`button-add-instruction-${groupIndex}`}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Step
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={addGroup}
                data-testid="button-add-group"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Recipe Section (e.g., for Spaghetti & Meatballs)
              </Button>

              <div className="flex gap-3">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => navigate("/add-recipe")}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={createMutation.isPending}
                  data-testid="button-submit"
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Recipe"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </main>
    </div>
  );
}
