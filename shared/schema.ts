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
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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

export const recipesRelations = relations(recipes, ({ one }) => ({
  family: one(families, {
    fields: [recipes.familyId],
    references: [families.id],
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
}).extend({
  groups: z.array(recipeGroupSchema),
});

export const updateRecipeSchema = insertRecipeSchema.partial();

// Types
export type Family = typeof families.$inferSelect;
export type InsertFamily = z.infer<typeof insertFamilySchema>;
export type FamilyMember = typeof familyMembers.$inferSelect;
export type InsertFamilyMember = z.infer<typeof insertFamilyMemberSchema>;
export type Recipe = typeof recipes.$inferSelect;
export type InsertRecipe = z.infer<typeof insertRecipeSchema>;
export type UpdateRecipe = z.infer<typeof updateRecipeSchema>;

// Extended recipe type with creator info
export type RecipeWithCreator = Recipe & {
  creatorFirstName?: string | null;
  creatorLastName?: string | null;
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
