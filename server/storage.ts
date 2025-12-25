import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { 
  families, 
  familyMembers, 
  recipes,
  users,
  type Family, 
  type FamilyMember, 
  type Recipe, 
  type RecipeWithCreator,
  type FamilyWithMembers,
  type InsertRecipe,
  type UpdateRecipe,
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
  getRecipesByFamily(familyId: string): Promise<RecipeWithCreator[]>;
  updateRecipe(id: string, data: UpdateRecipe): Promise<Recipe | undefined>;
  deleteRecipe(id: string): Promise<boolean>;
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
}

export const storage = new DatabaseStorage();
