import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, serial, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Re-export auth models
export * from "./models/auth";

// Recipe categories enum
export const recipeCategories = [
  "Breakfast",
  "Lunch", 
  "Dinner",
  "Snack",
  "Appetizer",
  "Drink",
  "Dessert"
] as const;

export type RecipeCategory = typeof recipeCategories[number];

// Families table
export const families = pgTable("families", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  createdById: varchar("created_by_id").notNull(),
  inviteCode: varchar("invite_code", { length: 32 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Family members junction table
export const familyMembers = pgTable("family_members", {
  id: serial("id").primaryKey(),
  familyId: varchar("family_id").notNull().references(() => families.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

// Ingredient schema for recipe groups
export const ingredientSchema = z.object({
  name: z.string(),
  amount: z.string(),
  unit: z.string(),
});

export type Ingredient = z.infer<typeof ingredientSchema>;

// Recipe group schema (for grouped recipes like spaghetti and meatballs)
export const recipeGroupSchema = z.object({
  name: z.string(),
  ingredients: z.array(ingredientSchema),
  instructions: z.array(z.string()),
});

export type RecipeGroup = z.infer<typeof recipeGroupSchema>;

// Recipes table
export const recipes = pgTable("recipes", {
  id: varchar("id", { length: 8 }).primaryKey(),
  familyId: varchar("family_id").notNull().references(() => families.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  prepTime: integer("prep_time"), // in minutes
  cookTime: integer("cook_time"), // in minutes
  servings: integer("servings").default(4),
  imageUrl: text("image_url"),
  groups: jsonb("groups").$type<RecipeGroup[]>().notNull().default([]),
  createdById: varchar("created_by_id").notNull(),
  isPublic: boolean("is_public").default(false).notNull(),
  viewCount: integer("view_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Saved recipes table (users saving other people's recipes)
export const savedRecipes = pgTable("saved_recipes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  recipeId: varchar("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
  savedAt: timestamp("saved_at").defaultNow().notNull(),
});

// Recipe ratings table
export const recipeRatings = pgTable("recipe_ratings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  recipeId: varchar("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(), // 1-5
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Recipe cooks table (tracking when users cook a recipe)
export const recipeCooks = pgTable("recipe_cooks", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  recipeId: varchar("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
  cookedAt: timestamp("cooked_at").defaultNow().notNull(),
});

// Recipe comments table
export const recipeComments = pgTable("recipe_comments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  recipeId: varchar("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  isHidden: boolean("is_hidden").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const familiesRelations = relations(families, ({ many }) => ({
  members: many(familyMembers),
  recipes: many(recipes),
}));

export const familyMembersRelations = relations(familyMembers, ({ one }) => ({
  family: one(families, {
    fields: [familyMembers.familyId],
    references: [families.id],
  }),
}));

export const recipesRelations = relations(recipes, ({ one, many }) => ({
  family: one(families, {
    fields: [recipes.familyId],
    references: [families.id],
  }),
  savedBy: many(savedRecipes),
  ratings: many(recipeRatings),
  cooks: many(recipeCooks),
  comments: many(recipeComments),
}));

export const savedRecipesRelations = relations(savedRecipes, ({ one }) => ({
  recipe: one(recipes, {
    fields: [savedRecipes.recipeId],
    references: [recipes.id],
  }),
}));

export const recipeRatingsRelations = relations(recipeRatings, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeRatings.recipeId],
    references: [recipes.id],
  }),
}));

export const recipeCooksRelations = relations(recipeCooks, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeCooks.recipeId],
    references: [recipes.id],
  }),
}));

export const recipeCommentsRelations = relations(recipeComments, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeComments.recipeId],
    references: [recipes.id],
  }),
}));

// Insert schemas
export const insertFamilySchema = createInsertSchema(families).omit({
  id: true,
  createdAt: true,
  inviteCode: true,
});

export const insertFamilyMemberSchema = createInsertSchema(familyMembers).omit({
  id: true,
  joinedAt: true,
});

export const insertRecipeSchema = createInsertSchema(recipes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  viewCount: true,
}).extend({
  groups: z.array(recipeGroupSchema),
});

export const updateRecipeSchema = insertRecipeSchema.partial();

export const insertSavedRecipeSchema = createInsertSchema(savedRecipes).omit({
  id: true,
  savedAt: true,
});

export const insertRecipeRatingSchema = createInsertSchema(recipeRatings).omit({
  id: true,
  createdAt: true,
}).extend({
  rating: z.number().min(1).max(5),
});

export const insertRecipeCookSchema = createInsertSchema(recipeCooks).omit({
  id: true,
  cookedAt: true,
});

export const insertRecipeCommentSchema = createInsertSchema(recipeComments).omit({
  id: true,
  createdAt: true,
  isHidden: true,
});

// Types
export type Family = typeof families.$inferSelect;
export type InsertFamily = z.infer<typeof insertFamilySchema>;
export type FamilyMember = typeof familyMembers.$inferSelect;
export type InsertFamilyMember = z.infer<typeof insertFamilyMemberSchema>;
export type Recipe = typeof recipes.$inferSelect;
export type InsertRecipe = z.infer<typeof insertRecipeSchema>;
export type UpdateRecipe = z.infer<typeof updateRecipeSchema>;
export type SavedRecipe = typeof savedRecipes.$inferSelect;
export type InsertSavedRecipe = z.infer<typeof insertSavedRecipeSchema>;
export type RecipeRating = typeof recipeRatings.$inferSelect;
export type InsertRecipeRating = z.infer<typeof insertRecipeRatingSchema>;
export type RecipeCook = typeof recipeCooks.$inferSelect;
export type InsertRecipeCook = z.infer<typeof insertRecipeCookSchema>;
export type RecipeComment = typeof recipeComments.$inferSelect;
export type InsertRecipeComment = z.infer<typeof insertRecipeCommentSchema>;

// Extended recipe type with creator info
export type RecipeWithCreator = Recipe & {
  creatorFirstName?: string | null;
  creatorLastName?: string | null;
};

// Extended recipe type with all social stats
export type RecipeWithStats = RecipeWithCreator & {
  averageRating?: number | null;
  ratingCount: number;
  cookCount: number;
  commentCount: number;
  isSaved?: boolean;
  userRating?: number | null;
  canCookAgain?: boolean;
};

// Comment with user info
export type CommentWithUser = RecipeComment & {
  userFirstName?: string | null;
  userLastName?: string | null;
  userProfileImageUrl?: string | null;
};

// Family with members type
export type FamilyWithMembers = Family & {
  members: Array<{
    id: number;
    userId: string;
    firstName?: string | null;
    lastName?: string | null;
    profileImageUrl?: string | null;
  }>;
};
