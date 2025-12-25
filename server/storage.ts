import { db } from "./db";
import { eq, and, sql, desc, gte, or, ilike } from "drizzle-orm";
import { nanoid } from "nanoid";
import { 
  families, 
  familyMembers, 
  recipes,
  savedRecipes,
  recipeRatings,
  recipeCooks,
  recipeComments,
  admins,
  users,
  type Family, 
  type FamilyMember, 
  type Recipe, 
  type RecipeWithCreator,
  type RecipeWithStats,
  type CommentWithUser,
  type FamilyWithMembers,
  type InsertRecipe,
  type UpdateRecipe,
  type SavedRecipe,
  type RecipeRating,
  type RecipeCook,
  type RecipeComment,
  type Admin,
} from "@shared/schema";

function generateRecipeId(): string {
  return nanoid(8);
}

function generateInviteCode(): string {
  return nanoid(16);
}

export interface IStorage {
  // Family operations
  createFamily(name: string, createdById: string): Promise<Family>;
  getFamily(id: string): Promise<Family | undefined>;
  getFamilyByCreator(createdById: string): Promise<Family | undefined>;
  getFamilyByInviteCode(inviteCode: string): Promise<Family | undefined>;
  getFamilyByMember(userId: string): Promise<Family | undefined>;
  getFamilyWithMembers(id: string): Promise<FamilyWithMembers | undefined>;
  updateFamily(id: string, name: string): Promise<Family | undefined>;

  // Family member operations
  addFamilyMember(familyId: string, userId: string): Promise<FamilyMember>;
  isFamilyMember(familyId: string, userId: string): Promise<boolean>;
  getFamilyMemberCount(familyId: string): Promise<number>;

  // Recipe operations
  createRecipe(familyId: string, createdById: string, data: Omit<InsertRecipe, 'familyId' | 'createdById'>): Promise<Recipe>;
  getRecipe(id: string): Promise<Recipe | undefined>;
  getRecipeWithCreator(id: string): Promise<RecipeWithCreator | undefined>;
  getRecipeWithStats(id: string, userId?: string): Promise<RecipeWithStats | undefined>;
  getRecipesByFamily(familyId: string): Promise<RecipeWithCreator[]>;
  getPublicRecipes(category?: string): Promise<RecipeWithCreator[]>;
  searchRecipes(userId: string, query: string, limit?: number): Promise<RecipeWithCreator[]>;
  getSavedRecipes(userId: string): Promise<RecipeWithCreator[]>;
  updateRecipe(id: string, data: UpdateRecipe): Promise<Recipe | undefined>;
  deleteRecipe(id: string): Promise<boolean>;
  incrementViewCount(id: string): Promise<void>;

  // Save recipe operations
  saveRecipe(userId: string, recipeId: string): Promise<SavedRecipe>;
  unsaveRecipe(userId: string, recipeId: string): Promise<boolean>;
  isRecipeSaved(userId: string, recipeId: string): Promise<boolean>;

  // Rating operations
  rateRecipe(userId: string, recipeId: string, rating: number): Promise<RecipeRating>;
  getUserRating(userId: string, recipeId: string): Promise<number | null>;
  getAverageRating(recipeId: string): Promise<{ average: number | null; count: number }>;

  // Cook tracking operations
  markCooked(userId: string, recipeId: string): Promise<RecipeCook>;
  canUserCookAgain(userId: string, recipeId: string): Promise<boolean>;
  getCookCount(recipeId: string): Promise<number>;

  // Comment operations
  addComment(userId: string, recipeId: string, content: string): Promise<RecipeComment>;
  getComments(recipeId: string, showHidden?: boolean): Promise<CommentWithUser[]>;
  hideComment(commentId: number, recipeOwnerId: string): Promise<boolean>;

  // Admin operations
  isAdmin(userId: string): Promise<boolean>;
  addAdmin(userId: string): Promise<Admin>;
  removeAdmin(userId: string): Promise<boolean>;
  getAllAdmins(): Promise<Admin[]>;

  // Admin data operations
  getAdminStats(): Promise<{
    totalUsers: number;
    totalFamilies: number;
    totalRecipes: number;
    publicRecipes: number;
    recentUsers: number;
    recentRecipes: number;
  }>;
  getAllUsers(): Promise<Array<{
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
    createdAt: Date;
    familyId: string | null;
    familyName: string | null;
    recipeCount: number;
  }>>;
  getAllFamiliesWithStats(): Promise<Array<{
    id: string;
    name: string;
    createdById: string;
    inviteCode: string;
    createdAt: Date;
    memberCount: number;
    recipeCount: number;
    creatorName: string | null;
  }>>;
  getAllRecipesAdmin(): Promise<Array<{
    id: string;
    name: string;
    category: string;
    isPublic: boolean;
    viewCount: number;
    createdAt: Date;
    familyName: string | null;
    creatorName: string | null;
  }>>;
}

class DatabaseStorage implements IStorage {
  // Family operations
  async createFamily(name: string, createdById: string): Promise<Family> {
    const inviteCode = generateInviteCode();
    const [family] = await db
      .insert(families)
      .values({ name, createdById, inviteCode })
      .returning();
    
    // Add creator as first member
    await this.addFamilyMember(family.id, createdById);
    
    return family;
  }

  async getFamily(id: string): Promise<Family | undefined> {
    const [family] = await db.select().from(families).where(eq(families.id, id));
    return family;
  }

  async getFamilyByCreator(createdById: string): Promise<Family | undefined> {
    const [family] = await db.select().from(families).where(eq(families.createdById, createdById));
    return family;
  }

  async getFamilyByInviteCode(inviteCode: string): Promise<Family | undefined> {
    const [family] = await db.select().from(families).where(eq(families.inviteCode, inviteCode));
    return family;
  }

  async getFamilyByMember(userId: string): Promise<Family | undefined> {
    const [member] = await db.select().from(familyMembers).where(eq(familyMembers.userId, userId));
    if (!member) return undefined;
    return this.getFamily(member.familyId);
  }

  async getFamilyWithMembers(id: string): Promise<FamilyWithMembers | undefined> {
    const family = await this.getFamily(id);
    if (!family) return undefined;

    const members = await db
      .select({
        id: familyMembers.id,
        userId: familyMembers.userId,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
      })
      .from(familyMembers)
      .leftJoin(users, eq(familyMembers.userId, users.id))
      .where(eq(familyMembers.familyId, id));

    return { ...family, members };
  }

  async updateFamily(id: string, name: string): Promise<Family | undefined> {
    const [family] = await db
      .update(families)
      .set({ name })
      .where(eq(families.id, id))
      .returning();
    return family;
  }

  // Family member operations
  async addFamilyMember(familyId: string, userId: string): Promise<FamilyMember> {
    const existing = await this.isFamilyMember(familyId, userId);
    if (existing) {
      const [member] = await db
        .select()
        .from(familyMembers)
        .where(and(eq(familyMembers.familyId, familyId), eq(familyMembers.userId, userId)));
      return member;
    }

    const [member] = await db
      .insert(familyMembers)
      .values({ familyId, userId })
      .returning();
    return member;
  }

  async isFamilyMember(familyId: string, userId: string): Promise<boolean> {
    const [member] = await db
      .select()
      .from(familyMembers)
      .where(and(eq(familyMembers.familyId, familyId), eq(familyMembers.userId, userId)));
    return !!member;
  }

  async getFamilyMemberCount(familyId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(familyMembers)
      .where(eq(familyMembers.familyId, familyId));
    return Number(result[0]?.count ?? 0);
  }

  // Recipe operations
  async createRecipe(
    familyId: string, 
    createdById: string, 
    data: Omit<InsertRecipe, 'familyId' | 'createdById'>
  ): Promise<Recipe> {
    const id = generateRecipeId();
    const [recipe] = await db
      .insert(recipes)
      .values({
        id,
        familyId,
        createdById,
        ...data,
      })
      .returning();
    return recipe;
  }

  async getRecipe(id: string): Promise<Recipe | undefined> {
    const [recipe] = await db.select().from(recipes).where(eq(recipes.id, id));
    return recipe;
  }

  async getRecipeWithCreator(id: string): Promise<RecipeWithCreator | undefined> {
    const [result] = await db
      .select({
        recipe: recipes,
        creatorFirstName: users.firstName,
        creatorLastName: users.lastName,
      })
      .from(recipes)
      .leftJoin(users, eq(recipes.createdById, users.id))
      .where(eq(recipes.id, id));

    if (!result) return undefined;

    return {
      ...result.recipe,
      creatorFirstName: result.creatorFirstName,
      creatorLastName: result.creatorLastName,
    };
  }

  async getRecipesByFamily(familyId: string): Promise<RecipeWithCreator[]> {
    const results = await db
      .select({
        recipe: recipes,
        creatorFirstName: users.firstName,
        creatorLastName: users.lastName,
      })
      .from(recipes)
      .leftJoin(users, eq(recipes.createdById, users.id))
      .where(eq(recipes.familyId, familyId));

    return results.map(({ recipe, creatorFirstName, creatorLastName }) => ({
      ...recipe,
      creatorFirstName,
      creatorLastName,
    }));
  }

  async updateRecipe(id: string, data: UpdateRecipe): Promise<Recipe | undefined> {
    const [recipe] = await db
      .update(recipes)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(recipes.id, id))
      .returning();
    return recipe;
  }

  async deleteRecipe(id: string): Promise<boolean> {
    const result = await db.delete(recipes).where(eq(recipes.id, id));
    return true;
  }

  async getRecipeWithStats(id: string, userId?: string): Promise<RecipeWithStats | undefined> {
    const recipe = await this.getRecipeWithCreator(id);
    if (!recipe) return undefined;

    const [ratingData, cookCount, commentCount] = await Promise.all([
      this.getAverageRating(id),
      this.getCookCount(id),
      db.select({ count: sql<number>`COUNT(*)` })
        .from(recipeComments)
        .where(and(eq(recipeComments.recipeId, id), eq(recipeComments.isHidden, false))),
    ]);

    let isSaved = false;
    let userRating: number | null = null;
    let canCookAgain = true;

    if (userId) {
      [isSaved, userRating, canCookAgain] = await Promise.all([
        this.isRecipeSaved(userId, id),
        this.getUserRating(userId, id),
        this.canUserCookAgain(userId, id),
      ]);
    }

    return {
      ...recipe,
      averageRating: ratingData.average,
      ratingCount: ratingData.count,
      cookCount,
      commentCount: Number(commentCount[0]?.count ?? 0),
      isSaved,
      userRating,
      canCookAgain,
    };
  }

  async getPublicRecipes(category?: string): Promise<RecipeWithCreator[]> {
    let query = db
      .select({
        recipe: recipes,
        creatorFirstName: users.firstName,
        creatorLastName: users.lastName,
      })
      .from(recipes)
      .leftJoin(users, eq(recipes.createdById, users.id))
      .where(eq(recipes.isPublic, true));

    const results = await query;

    return results
      .filter(({ recipe }) => !category || recipe.category.toLowerCase() === category.toLowerCase())
      .map(({ recipe, creatorFirstName, creatorLastName }) => ({
        ...recipe,
        creatorFirstName,
        creatorLastName,
      }));
  }

  async searchRecipes(userId: string, query: string, limit: number = 20): Promise<RecipeWithCreator[]> {
    // Get user's family
    const membership = await db
      .select({ familyId: familyMembers.familyId })
      .from(familyMembers)
      .where(eq(familyMembers.userId, userId))
      .limit(1);
    
    const familyId = membership[0]?.familyId;
    const searchPattern = `%${query}%`;
    
    // Search recipes user has access to: either in their family or public
    const results = await db
      .select({
        recipe: recipes,
        creatorFirstName: users.firstName,
        creatorLastName: users.lastName,
      })
      .from(recipes)
      .leftJoin(users, eq(recipes.createdById, users.id))
      .where(
        and(
          ilike(recipes.name, searchPattern),
          familyId 
            ? or(eq(recipes.familyId, familyId), eq(recipes.isPublic, true))
            : eq(recipes.isPublic, true)
        )
      )
      .orderBy(desc(recipes.createdAt))
      .limit(limit);

    return results.map(({ recipe, creatorFirstName, creatorLastName }) => ({
      ...recipe,
      creatorFirstName,
      creatorLastName,
    }));
  }

  async getSavedRecipes(userId: string): Promise<RecipeWithCreator[]> {
    const results = await db
      .select({
        recipe: recipes,
        creatorFirstName: users.firstName,
        creatorLastName: users.lastName,
      })
      .from(savedRecipes)
      .innerJoin(recipes, eq(savedRecipes.recipeId, recipes.id))
      .leftJoin(users, eq(recipes.createdById, users.id))
      .where(eq(savedRecipes.userId, userId));

    return results.map(({ recipe, creatorFirstName, creatorLastName }) => ({
      ...recipe,
      creatorFirstName,
      creatorLastName,
    }));
  }

  async incrementViewCount(id: string): Promise<void> {
    await db
      .update(recipes)
      .set({ viewCount: sql`${recipes.viewCount} + 1` })
      .where(eq(recipes.id, id));
  }

  // Save recipe operations
  async saveRecipe(userId: string, recipeId: string): Promise<SavedRecipe> {
    const existing = await this.isRecipeSaved(userId, recipeId);
    if (existing) {
      const [saved] = await db
        .select()
        .from(savedRecipes)
        .where(and(eq(savedRecipes.userId, userId), eq(savedRecipes.recipeId, recipeId)));
      return saved;
    }

    const [saved] = await db
      .insert(savedRecipes)
      .values({ userId, recipeId })
      .returning();
    return saved;
  }

  async unsaveRecipe(userId: string, recipeId: string): Promise<boolean> {
    await db
      .delete(savedRecipes)
      .where(and(eq(savedRecipes.userId, userId), eq(savedRecipes.recipeId, recipeId)));
    return true;
  }

  async isRecipeSaved(userId: string, recipeId: string): Promise<boolean> {
    const [saved] = await db
      .select()
      .from(savedRecipes)
      .where(and(eq(savedRecipes.userId, userId), eq(savedRecipes.recipeId, recipeId)));
    return !!saved;
  }

  // Rating operations
  async rateRecipe(userId: string, recipeId: string, rating: number): Promise<RecipeRating> {
    const existing = await db
      .select()
      .from(recipeRatings)
      .where(and(eq(recipeRatings.userId, userId), eq(recipeRatings.recipeId, recipeId)));

    if (existing.length > 0) {
      const [updated] = await db
        .update(recipeRatings)
        .set({ rating })
        .where(and(eq(recipeRatings.userId, userId), eq(recipeRatings.recipeId, recipeId)))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(recipeRatings)
      .values({ userId, recipeId, rating })
      .returning();
    return created;
  }

  async getUserRating(userId: string, recipeId: string): Promise<number | null> {
    const [rating] = await db
      .select()
      .from(recipeRatings)
      .where(and(eq(recipeRatings.userId, userId), eq(recipeRatings.recipeId, recipeId)));
    return rating?.rating ?? null;
  }

  async getAverageRating(recipeId: string): Promise<{ average: number | null; count: number }> {
    const result = await db
      .select({
        average: sql<number>`AVG(${recipeRatings.rating})`,
        count: sql<number>`COUNT(*)`,
      })
      .from(recipeRatings)
      .where(eq(recipeRatings.recipeId, recipeId));

    return {
      average: result[0]?.average ? Number(result[0].average) : null,
      count: Number(result[0]?.count ?? 0),
    };
  }

  // Cook tracking operations
  async markCooked(userId: string, recipeId: string): Promise<RecipeCook> {
    const [cook] = await db
      .insert(recipeCooks)
      .values({ userId, recipeId })
      .returning();
    return cook;
  }

  async canUserCookAgain(userId: string, recipeId: string): Promise<boolean> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [recentCook] = await db
      .select()
      .from(recipeCooks)
      .where(
        and(
          eq(recipeCooks.userId, userId),
          eq(recipeCooks.recipeId, recipeId),
          gte(recipeCooks.cookedAt, twentyFourHoursAgo)
        )
      );
    return !recentCook;
  }

  async getCookCount(recipeId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(recipeCooks)
      .where(eq(recipeCooks.recipeId, recipeId));
    return Number(result[0]?.count ?? 0);
  }

  // Comment operations
  async addComment(userId: string, recipeId: string, content: string): Promise<RecipeComment> {
    const [comment] = await db
      .insert(recipeComments)
      .values({ userId, recipeId, content })
      .returning();
    return comment;
  }

  async getComments(recipeId: string, showHidden = false): Promise<CommentWithUser[]> {
    const whereClause = showHidden
      ? eq(recipeComments.recipeId, recipeId)
      : and(eq(recipeComments.recipeId, recipeId), eq(recipeComments.isHidden, false));

    const results = await db
      .select({
        comment: recipeComments,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        userProfileImageUrl: users.profileImageUrl,
      })
      .from(recipeComments)
      .leftJoin(users, eq(recipeComments.userId, users.id))
      .where(whereClause)
      .orderBy(desc(recipeComments.createdAt));

    return results.map(({ comment, userFirstName, userLastName, userProfileImageUrl }) => ({
      ...comment,
      userFirstName,
      userLastName,
      userProfileImageUrl,
    }));
  }

  async hideComment(commentId: number, recipeOwnerId: string): Promise<boolean> {
    const [comment] = await db.select().from(recipeComments).where(eq(recipeComments.id, commentId));
    if (!comment) return false;

    const [recipe] = await db.select().from(recipes).where(eq(recipes.id, comment.recipeId));
    if (!recipe || recipe.createdById !== recipeOwnerId) return false;

    await db
      .update(recipeComments)
      .set({ isHidden: true })
      .where(eq(recipeComments.id, commentId));
    return true;
  }

  // Admin operations
  async isAdmin(userId: string): Promise<boolean> {
    const [admin] = await db.select().from(admins).where(eq(admins.userId, userId));
    return !!admin;
  }

  async addAdmin(userId: string): Promise<Admin> {
    const existing = await this.isAdmin(userId);
    if (existing) {
      const [admin] = await db.select().from(admins).where(eq(admins.userId, userId));
      return admin;
    }
    const [admin] = await db.insert(admins).values({ userId }).returning();
    return admin;
  }

  async removeAdmin(userId: string): Promise<boolean> {
    await db.delete(admins).where(eq(admins.userId, userId));
    return true;
  }

  async getAllAdmins(): Promise<Admin[]> {
    return db.select().from(admins);
  }

  // Admin data operations
  async getAdminStats(): Promise<{
    totalUsers: number;
    totalFamilies: number;
    totalRecipes: number;
    publicRecipes: number;
    recentUsers: number;
    recentRecipes: number;
  }> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [userCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(users);
    const [familyCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(families);
    const [recipeCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(recipes);
    const [publicCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(recipes).where(eq(recipes.isPublic, true));
    const [recentUserCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(users).where(gte(users.createdAt, sevenDaysAgo));
    const [recentRecipeCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(recipes).where(gte(recipes.createdAt, sevenDaysAgo));

    return {
      totalUsers: Number(userCount?.count ?? 0),
      totalFamilies: Number(familyCount?.count ?? 0),
      totalRecipes: Number(recipeCount?.count ?? 0),
      publicRecipes: Number(publicCount?.count ?? 0),
      recentUsers: Number(recentUserCount?.count ?? 0),
      recentRecipes: Number(recentRecipeCount?.count ?? 0),
    };
  }

  async getAllUsers(): Promise<Array<{
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
    createdAt: Date;
    familyId: string | null;
    familyName: string | null;
    recipeCount: number;
  }>> {
    const results = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        createdAt: users.createdAt,
        familyId: familyMembers.familyId,
        familyName: families.name,
      })
      .from(users)
      .leftJoin(familyMembers, eq(users.id, familyMembers.userId))
      .leftJoin(families, eq(familyMembers.familyId, families.id))
      .orderBy(desc(users.createdAt));

    const usersWithRecipes = await Promise.all(
      results.map(async (user) => {
        const [count] = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(recipes)
          .where(eq(recipes.createdById, user.id));
        return { ...user, recipeCount: Number(count?.count ?? 0) };
      })
    );

    return usersWithRecipes;
  }

  async getAllFamiliesWithStats(): Promise<Array<{
    id: string;
    name: string;
    createdById: string;
    inviteCode: string;
    createdAt: Date;
    memberCount: number;
    recipeCount: number;
    creatorName: string | null;
  }>> {
    const allFamilies = await db
      .select({
        id: families.id,
        name: families.name,
        createdById: families.createdById,
        inviteCode: families.inviteCode,
        createdAt: families.createdAt,
        creatorFirstName: users.firstName,
        creatorLastName: users.lastName,
      })
      .from(families)
      .leftJoin(users, eq(families.createdById, users.id))
      .orderBy(desc(families.createdAt));

    const familiesWithStats = await Promise.all(
      allFamilies.map(async (family) => {
        const [memberCount] = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(familyMembers)
          .where(eq(familyMembers.familyId, family.id));
        const [recipeCount] = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(recipes)
          .where(eq(recipes.familyId, family.id));
        return {
          id: family.id,
          name: family.name,
          createdById: family.createdById,
          inviteCode: family.inviteCode,
          createdAt: family.createdAt,
          memberCount: Number(memberCount?.count ?? 0),
          recipeCount: Number(recipeCount?.count ?? 0),
          creatorName: family.creatorFirstName && family.creatorLastName
            ? `${family.creatorFirstName} ${family.creatorLastName}`
            : family.creatorFirstName || null,
        };
      })
    );

    return familiesWithStats;
  }

  async getAllRecipesAdmin(): Promise<Array<{
    id: string;
    name: string;
    category: string;
    isPublic: boolean;
    viewCount: number;
    createdAt: Date;
    familyName: string | null;
    creatorName: string | null;
  }>> {
    const results = await db
      .select({
        id: recipes.id,
        name: recipes.name,
        category: recipes.category,
        isPublic: recipes.isPublic,
        viewCount: recipes.viewCount,
        createdAt: recipes.createdAt,
        familyName: families.name,
        creatorFirstName: users.firstName,
        creatorLastName: users.lastName,
      })
      .from(recipes)
      .leftJoin(families, eq(recipes.familyId, families.id))
      .leftJoin(users, eq(recipes.createdById, users.id))
      .orderBy(desc(recipes.createdAt));

    return results.map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      isPublic: r.isPublic,
      viewCount: r.viewCount,
      createdAt: r.createdAt,
      familyName: r.familyName,
      creatorName: r.creatorFirstName && r.creatorLastName
        ? `${r.creatorFirstName} ${r.creatorLastName}`
        : r.creatorFirstName || null,
    }));
  }
}

export const storage = new DatabaseStorage();
