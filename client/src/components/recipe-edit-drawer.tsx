import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
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
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { RecipeWithCreator } from "@shared/schema";
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
  prepTime: z.coerce.number().min(0).optional().nullable(),
  cookTime: z.coerce.number().min(0).optional().nullable(),
  servings: z.coerce.number().min(1).default(4),
  groups: z.array(recipeGroupSchema).min(1, "Add at least one recipe section"),
});

type FormValues = z.infer<typeof formSchema>;

interface RecipeEditDrawerProps {
  recipe: RecipeWithCreator;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecipeEditDrawer({ recipe, open, onOpenChange }: RecipeEditDrawerProps) {
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
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
    },
  });

  useEffect(() => {
    if (open) {
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
  }, [open, recipe, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return apiRequest("PATCH", `/api/recipes/${recipe.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes", recipe.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      onOpenChange(false);
      toast({ title: "Saved", description: "Recipe updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update recipe", variant: "destructive" });
    },
  });

  const onSubmit = (values: FormValues) => {
    updateMutation.mutate(values);
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

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="border-b border-border px-6">
          <DrawerTitle>Edit Recipe</DrawerTitle>
        </DrawerHeader>
        
        <ScrollArea className="flex-1 px-6 py-4" style={{ height: "calc(90vh - 140px)" }}>
          <Form {...form}>
            <form id="edit-recipe-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipe Name</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-edit-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-category">
                            <SelectValue />
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
                  name="prepTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prep (min)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={0} 
                          {...field} 
                          value={field.value ?? ""} 
                          data-testid="input-edit-prep" 
                        />
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
                      <FormLabel>Cook (min)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={0} 
                          {...field} 
                          value={field.value ?? ""} 
                          data-testid="input-edit-cook" 
                        />
                      </FormControl>
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
                        <Input type="number" min={1} {...field} data-testid="input-edit-servings" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {groups.map((group, groupIndex) => (
                <div key={groupIndex} className="border border-border rounded-lg p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <FormField
                      control={form.control}
                      name={`groups.${groupIndex}.name`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input 
                              placeholder="Section name" 
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

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Ingredients</p>
                    <div className="border border-border rounded-md overflow-hidden">
                      <Table>
                        <TableBody>
                          {group.ingredients.map((_, ingIndex) => (
                            <TableRow 
                              key={ingIndex}
                              className={ingIndex % 2 === 0 ? "bg-muted/30 border-0" : "border-0"}
                            >
                              <TableCell className="w-16 py-1.5 px-2">
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
                              <TableCell className="w-16 py-1.5 px-2">
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
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Instructions</p>
                    <div className="border border-border rounded-md overflow-hidden">
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
                                        className="min-h-[50px] text-sm" 
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
                  </div>
                </div>
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
            </form>
          </Form>
        </ScrollArea>

        <DrawerFooter className="border-t border-border px-6 flex-row gap-3">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="flex-1"
            data-testid="button-cancel-edit"
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            form="edit-recipe-form"
            disabled={updateMutation.isPending}
            className="flex-1"
            data-testid="button-save-edit"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
