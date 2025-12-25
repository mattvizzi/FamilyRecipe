import { Router, Response } from "express";
import { z } from "zod";
import { isAuthenticated } from "../replit_integrations/auth/replitAuth";
import { db } from "../db";
import { users } from "@shared/models/auth";
import { eq } from "drizzle-orm";
import { uploadProfileImage } from "../imageStorage";
import { type AuthRequest } from "../middleware";

const router = Router();

const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  profileImageUrl: z.string().optional(),
});

const uploadProfileImageSchema = z.object({
  imageData: z.string().min(1),
});

const completeOnboardingSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  profileImageData: z.string().optional(),
});

router.get("/profile", isAuthenticated, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.claims.sub;
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

router.patch("/profile", isAuthenticated, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.claims.sub;
    const parseResult = updateProfileSchema.safeParse(req.body);
    
    if (!parseResult.success) {
      return res.status(400).json({ message: "Invalid data", errors: parseResult.error.errors });
    }
    
    const { firstName, lastName, profileImageUrl } = parseResult.data;
    
    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (profileImageUrl !== undefined) updateData.profileImageUrl = profileImageUrl;
    
    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();
    
    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

router.post("/profile/upload-image", isAuthenticated, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.claims.sub;
    const parseResult = uploadProfileImageSchema.safeParse(req.body);
    
    if (!parseResult.success) {
      return res.status(400).json({ message: "Invalid data", errors: parseResult.error.errors });
    }
    
    const { imageData } = parseResult.data;
    
    const imageUrl = await uploadProfileImage(imageData, userId);
    
    const [updatedUser] = await db
      .update(users)
      .set({ profileImageUrl: imageUrl, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    
    res.json({ imageUrl, user: updatedUser });
  } catch (error) {
    console.error("Error uploading profile image:", error);
    res.status(500).json({ message: "Failed to upload image" });
  }
});

router.post("/complete-onboarding", isAuthenticated, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.claims.sub;
    const parseResult = completeOnboardingSchema.safeParse(req.body);
    
    if (!parseResult.success) {
      return res.status(400).json({ message: "Invalid data", errors: parseResult.error.errors });
    }
    
    const { firstName, lastName, profileImageData } = parseResult.data;
    
    const updateData: Record<string, any> = {
      firstName,
      lastName,
      onboardingCompleted: new Date(),
      updatedAt: new Date(),
    };
    
    if (profileImageData && profileImageData.startsWith("data:")) {
      const imageUrl = await uploadProfileImage(profileImageData, userId);
      updateData.profileImageUrl = imageUrl;
    }
    
    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();
    
    res.json(updatedUser);
  } catch (error) {
    console.error("Error completing onboarding:", error);
    res.status(500).json({ message: "Failed to complete onboarding" });
  }
});

router.get("/onboarding-status", isAuthenticated, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.claims.sub;
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json({
      needsOnboarding: !user.onboardingCompleted,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: user.profileImageUrl,
    });
  } catch (error) {
    console.error("Error checking onboarding status:", error);
    res.status(500).json({ message: "Failed to check onboarding status" });
  }
});

export default router;
