import type { Express, Request, Response, NextFunction, RequestHandler } from "express";
import { createServer, type Server } from "http";
import { randomBytes } from "crypto";
import rateLimit from "express-rate-limit";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replit_integrations/auth/replitAuth";
import { registerAuthRoutes } from "./replit_integrations/auth/routes";
import { authStorage } from "./replit_integrations/auth/storage";
import { openai, generateImageBuffer } from "./replit_integrations/image/client";
import { 
  insertRecipeSchema, 
  updateRecipeSchema, 
  recipeCategories, 
  familyNameSchema,
  insertCommentContentSchema,
  insertRatingSchema,
  visibilitySchema,
  type RecipeGroup 
} from "@shared/schema";
import PDFDocument from "pdfkit";
import { 
  syncFamilyToHubSpot, 
  syncRecipeToHubSpot,
  syncUserToHubSpot,
  associateContactWithCompany,
  getHubSpotContactByEmail,
  getHubSpotCompanyByFamilyId
} from "./hubspot";

// Rate limiters for expensive operations
const aiProcessingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 AI processing requests per 15 minutes per user
  message: { message: "Too many recipe processing requests. Please wait before trying again." },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const authReq = req as AuthRequest;
    return authReq.user?.claims?.sub || req.ip || 'unknown';
  },
});

const pdfExportLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // 20 PDF exports per 5 minutes per user
  message: { message: "Too many PDF export requests. Please wait before trying again." },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const authReq = req as AuthRequest;
    return authReq.user?.claims?.sub || req.ip || 'unknown';
  },
});
import { scaleAmount } from "@shared/lib/fraction";

interface AuthRequest extends Request {
  user?: {
    claims: {
      sub: string;
    };
  };
  session?: {
    csrfToken?: string;
  } & Request['session'];
}

// CSRF token generation
function generateCsrfToken(): string {
  return randomBytes(32).toString('hex');
}

// CSRF validation middleware for mutating requests
const validateCsrf: RequestHandler = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Only validate for state-changing methods
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const sessionToken = req.session?.csrfToken;
    const headerToken = req.headers['x-csrf-token'] as string;
    
    // Reject if no session token exists (user must fetch /api/csrf-token first)
    if (!sessionToken) {
      return res.status(403).json({ message: 'CSRF token not initialized. Please refresh and try again.' });
    }
    
    // Reject if header token doesn't match session token
    if (sessionToken !== headerToken) {
      return res.status(403).json({ message: 'Invalid CSRF token' });
    }
  }
  next();
};

// Helper to get user's family
async function getUserFamily(userId: string) {
  return storage.getFamilyByMember(userId);
}

// Helper to check if user can access a recipe (family member OR public recipe)
async function canAccessRecipe(userId: string, recipeId: string): Promise<{ canAccess: boolean; recipe: Awaited<ReturnType<typeof storage.getRecipe>> }> {
  const recipe = await storage.getRecipe(recipeId);
  if (!recipe) {
    return { canAccess: false, recipe: undefined };
  }
  
  // Public recipes are accessible to all authenticated users
  if (recipe.isPublic) {
    return { canAccess: true, recipe };
  }
  
  // Otherwise, must be a family member
  const isMember = await storage.isFamilyMember(recipe.familyId, userId);
  return { canAccess: isMember, recipe };
}

// Input sanitization helper - removes potential XSS vectors
function sanitizeHtml(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Initialize authentication
  await setupAuth(app);
  registerAuthRoutes(app);
  
  // ============ CSRF TOKEN ROUTE ============
  
  // Get or create CSRF token for the session
  app.get("/api/csrf-token", isAuthenticated, (req: AuthRequest, res: Response) => {
    if (!req.session!.csrfToken) {
      req.session!.csrfToken = generateCsrfToken();
    }
    res.json({ csrfToken: req.session!.csrfToken });
  });
  
  // Apply CSRF validation to all authenticated mutating routes
  app.use("/api", validateCsrf);
  
  // ============ FAMILY ROUTES ============
  
  // Get current user's family
  app.get("/api/family", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.claims.sub;
      const family = await getUserFamily(userId);
      
      // Return null with 200 status if no family, so frontend can handle onboarding
      res.json(family || null);
    } catch (error) {
      console.error("Error fetching family:", error);
      res.status(500).json({ message: "Failed to fetch family" });
    }
  });

  // Get family with members
  app.get("/api/family/details", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.claims.sub;
      const family = await getUserFamily(userId);
      
      if (!family) {
        // Return null for no family so frontend can handle appropriately
        return res.json(null);
      }
      
      const familyWithMembers = await storage.getFamilyWithMembers(family.id);
      res.json(familyWithMembers);
    } catch (error) {
      console.error("Error fetching family details:", error);
      res.status(500).json({ message: "Failed to fetch family details" });
    }
  });

  // Create a new family
  app.post("/api/family", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.claims.sub;
      
      // Validate with Zod schema
      const parseResult = familyNameSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: parseResult.error.errors[0]?.message || "Invalid family name" });
      }
      
      // Check if user already has a family
      const existingFamily = await getUserFamily(userId);
      if (existingFamily) {
        return res.status(400).json({ message: "You already belong to a family" });
      }
      
      const family = await storage.createFamily(parseResult.data.name, userId);
      
      // Sync family to HubSpot as a company (non-blocking)
      syncFamilyToHubSpot(family).then(async (companyId) => {
        if (companyId) {
          // Get user email to find their HubSpot contact and associate with company
          const user = await authStorage.getUser(userId);
          if (user?.email) {
            const contactId = await getHubSpotContactByEmail(user.email);
            if (contactId) {
              await associateContactWithCompany(contactId, companyId);
            }
          }
        }
      }).catch(err => {
        console.error("Failed to sync family to HubSpot:", err);
      });
      
      res.status(201).json(family);
    } catch (error) {
      console.error("Error creating family:", error);
      res.status(500).json({ message: "Failed to create family" });
    }
  });

  // Update family name
  app.patch("/api/family", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.claims.sub;
      
      // Validate with Zod schema
      const parseResult = familyNameSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: parseResult.error.errors[0]?.message || "Invalid family name" });
      }
      
      const family = await getUserFamily(userId);
      if (!family) {
        return res.status(404).json({ message: "No family found" });
      }
      
      const updated = await storage.updateFamily(family.id, parseResult.data.name);
      
      // Sync updated family to HubSpot (non-blocking)
      syncFamilyToHubSpot(updated).catch(err => {
        console.error("Failed to sync updated family to HubSpot:", err);
      });
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating family:", error);
      res.status(500).json({ message: "Failed to update family" });
    }
  });

  // Get family info by invite code (public)
  app.get("/api/family/invite/:code", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const { code } = req.params;
      const family = await storage.getFamilyByInviteCode(code);
      
      if (!family) {
        return res.status(404).json({ message: "Invalid invite code" });
      }
      
      const memberCount = await storage.getFamilyMemberCount(family.id);
      
      res.json({
        name: family.name,
        memberCount,
      });
    } catch (error) {
      console.error("Error fetching family by invite:", error);
      res.status(500).json({ message: "Failed to fetch family" });
    }
  });

  // Join a family
  app.post("/api/family/join/:code", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.claims.sub;
      const { code } = req.params;
      
      // Check if user already has a family
      const existingFamily = await getUserFamily(userId);
      if (existingFamily) {
        return res.status(400).json({ message: "You already belong to a family" });
      }
      
      const family = await storage.getFamilyByInviteCode(code);
      if (!family) {
        return res.status(404).json({ message: "Invalid invite code" });
      }
      
      await storage.addFamilyMember(family.id, userId);
      
      // Associate user with family company in HubSpot (non-blocking)
      (async () => {
        const user = await authStorage.getUser(userId);
        if (user?.email) {
          const contactId = await getHubSpotContactByEmail(user.email);
          const companyId = await getHubSpotCompanyByFamilyId(family.id);
          if (contactId && companyId) {
            await associateContactWithCompany(contactId, companyId);
          }
        }
      })().catch(err => {
        console.error("Failed to associate user with family in HubSpot:", err);
      });
      
      res.json(family);
    } catch (error) {
      console.error("Error joining family:", error);
      res.status(500).json({ message: "Failed to join family" });
    }
  });

  // ============ RECIPE ROUTES ============

  // Get all recipes for user's family
  app.get("/api/recipes", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.claims.sub;
      const family = await getUserFamily(userId);
      
      if (!family) {
        return res.status(404).json({ message: "No family found" });
      }
      
      const recipes = await storage.getRecipesByFamily(family.id);
      res.json(recipes);
    } catch (error) {
      console.error("Error fetching recipes:", error);
      res.status(500).json({ message: "Failed to fetch recipes" });
    }
  });

  // Get saved recipes - MUST be before /api/recipes/:id to avoid matching "saved" as an id
  app.get("/api/recipes/saved", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.claims.sub;
      const recipes = await storage.getSavedRecipes(userId);
      res.json(recipes);
    } catch (error) {
      console.error("Error fetching saved recipes:", error);
      res.status(500).json({ message: "Failed to fetch saved recipes" });
    }
  });

  // Get single recipe
  app.get("/api/recipes/:id", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.claims.sub;
      const { id } = req.params;
      
      const recipe = await storage.getRecipeWithCreator(id);
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      
      // Check if user has access
      const isMember = await storage.isFamilyMember(recipe.familyId, userId);
      if (!isMember) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(recipe);
    } catch (error) {
      console.error("Error fetching recipe:", error);
      res.status(500).json({ message: "Failed to fetch recipe" });
    }
  });

  // Create recipe manually
  app.post("/api/recipes", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.claims.sub;
      const family = await getUserFamily(userId);
      
      if (!family) {
        return res.status(404).json({ message: "No family found" });
      }
      
      const parseResult = insertRecipeSchema.omit({ familyId: true, createdById: true }).safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: "Invalid recipe data", errors: parseResult.error.errors });
      }
      
      const recipe = await storage.createRecipe(family.id, userId, parseResult.data);
      
      // Sync recipe to HubSpot as a deal (non-blocking)
      syncRecipeToHubSpot(recipe, family.name).catch(err => {
        console.error("Failed to sync recipe to HubSpot:", err);
      });
      
      res.status(201).json(recipe);
    } catch (error) {
      console.error("Error creating recipe:", error);
      res.status(500).json({ message: "Failed to create recipe" });
    }
  });

  // Process recipe with AI
  app.post("/api/recipes/process", isAuthenticated, aiProcessingLimiter, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.claims.sub;
      const family = await getUserFamily(userId);
      
      if (!family) {
        return res.status(404).json({ message: "No family found" });
      }
      
      const method = req.body.method || "text";
      const content = req.body.content || "";
      
      if (!content) {
        return res.status(400).json({ message: "Recipe content is required" });
      }
      
      // Build the extraction prompt
      const extractionPrompt = `
Extract the recipe from the following content. Return a JSON object with this exact structure:
{
  "name": "Recipe Name",
  "category": "Breakfast" | "Lunch" | "Dinner" | "Snack" | "Appetizer" | "Drink" | "Dessert",
  "prepTime": number (in minutes) or null,
  "cookTime": number (in minutes) or null,
  "servings": number,
  "groups": [
    {
      "name": "Main" (or section name for complex recipes),
      "ingredients": [
        { "name": "ingredient name", "amount": "1", "unit": "cup" }
      ],
      "instructions": ["Step 1...", "Step 2..."]
    }
  ]
}

For complex recipes like "Spaghetti and Meatballs", create separate groups for each component.
Use fractions for amounts where appropriate (e.g., "1/2", "1 1/2").
Choose the most appropriate category based on the recipe.
`;

      // Build messages based on content type (image or text)
      type ContentPart = { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } };
      let messages: Array<{ role: "user"; content: ContentPart[] }>;
      
      if ((method === "photo" || method === "camera") && content.includes("data:image")) {
        // Handle multiple images separated by |||IMAGE_SEPARATOR|||
        const images = content.split("|||IMAGE_SEPARATOR|||").filter((img: string) => img.trim());
        const contentParts: ContentPart[] = [
          { type: "text", text: extractionPrompt }
        ];
        
        for (const imageData of images) {
          contentParts.push({ type: "image_url", image_url: { url: imageData.trim() } });
        }
        
        messages = [{
          role: "user",
          content: contentParts
        }];
      } else {
        // Text or URL content
        messages = [{
          role: "user",
          content: [{ type: "text", text: extractionPrompt + "\n\nContent to extract:\n" + content }]
        }];
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        response_format: { type: "json_object" },
      });

      const extractedJson = completion.choices[0]?.message?.content;
      if (!extractedJson) {
        return res.status(400).json({ message: "Failed to extract recipe" });
      }

      let extracted;
      try {
        extracted = JSON.parse(extractedJson);
      } catch {
        return res.status(400).json({ message: "Failed to parse recipe data" });
      }

      // Validate extracted data
      if (!extracted.name || !Array.isArray(extracted.groups) || extracted.groups.length === 0) {
        return res.status(400).json({ message: "Could not extract valid recipe from content" });
      }

      // Validate each group has required fields
      for (const group of extracted.groups) {
        if (!group.name || !Array.isArray(group.ingredients) || !Array.isArray(group.instructions)) {
          return res.status(400).json({ message: "Invalid recipe structure" });
        }
        // Ensure each ingredient has required fields
        group.ingredients = group.ingredients.filter((ing: any) => ing && ing.name);
        for (const ing of group.ingredients) {
          ing.amount = ing.amount || "1";
          ing.unit = ing.unit || "";
        }
        // Filter out empty instructions
        group.instructions = group.instructions.filter((step: any) => step && typeof step === "string" && step.trim());
      }

      // Ensure category is valid
      if (!recipeCategories.includes(extracted.category)) {
        extracted.category = "Dinner";
      }

      // Generate a beautiful recipe image
      const imagePrompt = `Professional food photography of ${extracted.name}. 
Beautifully plated on an elegant white ceramic plate, overhead shot, soft natural lighting, 
garnished elegantly, appetizing and mouthwatering presentation, restaurant quality, 
high-end cookbook style photography, clean minimal background, 8k quality, 
shallow depth of field, food styling.`;

      let imageUrl: string | undefined;
      try {
        const imageBuffer = await generateImageBuffer(imagePrompt, "1024x1024");
        // For now, we'll store as base64 data URL (in production, upload to object storage)
        imageUrl = `data:image/png;base64,${imageBuffer.toString("base64")}`;
      } catch (imageError) {
        console.error("Image generation failed:", imageError);
        // Continue without image
      }

      // Create the recipe
      const recipe = await storage.createRecipe(family.id, userId, {
        name: extracted.name,
        category: extracted.category,
        prepTime: extracted.prepTime || null,
        cookTime: extracted.cookTime || null,
        servings: extracted.servings || 4,
        imageUrl,
        groups: extracted.groups,
      });

      // Sync recipe to HubSpot as a deal (non-blocking)
      syncRecipeToHubSpot(recipe, family.name).catch(err => {
        console.error("Failed to sync recipe to HubSpot:", err);
      });

      res.status(201).json(recipe);
    } catch (error) {
      console.error("Error processing recipe:", error);
      res.status(500).json({ message: "Failed to process recipe" });
    }
  });

  // Update recipe
  app.patch("/api/recipes/:id", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.claims.sub;
      const { id } = req.params;
      
      const recipe = await storage.getRecipe(id);
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      
      // Check if user has access
      const isMember = await storage.isFamilyMember(recipe.familyId, userId);
      if (!isMember) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const parseResult = updateRecipeSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: "Invalid recipe data", errors: parseResult.error.errors });
      }
      
      const updated = await storage.updateRecipe(id, parseResult.data);
      
      // Sync updated recipe to HubSpot (non-blocking)
      (async () => {
        const family = await storage.getFamily(recipe.familyId);
        if (family) {
          await syncRecipeToHubSpot(updated, family.name);
        }
      })().catch(err => {
        console.error("Failed to sync updated recipe to HubSpot:", err);
      });
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating recipe:", error);
      res.status(500).json({ message: "Failed to update recipe" });
    }
  });

  // Delete recipe
  app.delete("/api/recipes/:id", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.claims.sub;
      const { id } = req.params;
      
      const recipe = await storage.getRecipe(id);
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      
      // Check if user has access
      const isMember = await storage.isFamilyMember(recipe.familyId, userId);
      if (!isMember) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deleteRecipe(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting recipe:", error);
      res.status(500).json({ message: "Failed to delete recipe" });
    }
  });

  // Get recipe with stats (enhanced detail page)
  app.get("/api/recipes/:id/stats", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.claims.sub;
      const { id } = req.params;
      
      const recipe = await storage.getRecipeWithStats(id, userId);
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      
      // Check if user has access (either member of family or recipe is public)
      const isMember = await storage.isFamilyMember(recipe.familyId, userId);
      if (!isMember && !recipe.isPublic) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Increment view count
      await storage.incrementViewCount(id);
      
      res.json(recipe);
    } catch (error) {
      console.error("Error fetching recipe with stats:", error);
      res.status(500).json({ message: "Failed to fetch recipe" });
    }
  });

  // Get public recipes (all or by category)
  app.get("/api/public/recipes", async (req: Request, res: Response) => {
    try {
      const category = req.query.category as string | undefined;
      const recipes = await storage.getPublicRecipes(category);
      res.json(recipes);
    } catch (error) {
      console.error("Error fetching public recipes:", error);
      res.status(500).json({ message: "Failed to fetch public recipes" });
    }
  });

  // Save a recipe
  app.post("/api/recipes/:id/save", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.claims.sub;
      const { id } = req.params;
      
      // Check if user can access this recipe
      const { canAccess, recipe } = await canAccessRecipe(userId, id);
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      if (!canAccess) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const saved = await storage.saveRecipe(userId, id);
      res.status(201).json(saved);
    } catch (error) {
      console.error("Error saving recipe:", error);
      res.status(500).json({ message: "Failed to save recipe" });
    }
  });

  // Unsave a recipe
  app.delete("/api/recipes/:id/save", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.claims.sub;
      const { id } = req.params;
      
      // User can only unsave their own saved recipes - no need to check recipe access
      // since we're just removing from their saved list
      await storage.unsaveRecipe(userId, id);
      res.status(204).send();
    } catch (error) {
      console.error("Error unsaving recipe:", error);
      res.status(500).json({ message: "Failed to unsave recipe" });
    }
  });

  // Rate a recipe
  app.post("/api/recipes/:id/rate", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.claims.sub;
      const { id } = req.params;
      
      // Validate with Zod schema
      const parseResult = insertRatingSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: parseResult.error.errors[0]?.message || "Invalid rating" });
      }
      
      // Check if user can access this recipe
      const { canAccess, recipe } = await canAccessRecipe(userId, id);
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      if (!canAccess) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const result = await storage.rateRecipe(userId, id, parseResult.data.rating);
      res.status(201).json(result);
    } catch (error) {
      console.error("Error rating recipe:", error);
      res.status(500).json({ message: "Failed to rate recipe" });
    }
  });

  // Mark recipe as cooked
  app.post("/api/recipes/:id/cook", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.claims.sub;
      const { id } = req.params;
      
      // Check if user can access this recipe
      const { canAccess, recipe } = await canAccessRecipe(userId, id);
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      if (!canAccess) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const canCook = await storage.canUserCookAgain(userId, id);
      if (!canCook) {
        return res.status(429).json({ message: "You can only mark a recipe as cooked once every 24 hours" });
      }
      
      const result = await storage.markCooked(userId, id);
      res.status(201).json(result);
    } catch (error) {
      console.error("Error marking recipe as cooked:", error);
      res.status(500).json({ message: "Failed to mark recipe as cooked" });
    }
  });

  // Get comments for a recipe
  app.get("/api/recipes/:id/comments", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.claims.sub;
      const { id } = req.params;
      
      // Check if user can access this recipe
      const { canAccess, recipe } = await canAccessRecipe(userId, id);
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      if (!canAccess) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Show hidden comments only to recipe owner
      const showHidden = recipe.createdById === userId;
      const comments = await storage.getComments(id, showHidden);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  // Simple profanity filter word list
  const profanityList = [
    "fuck", "shit", "damn", "ass", "bitch", "crap", "bastard", "dick", "cock", 
    "pussy", "cunt", "whore", "slut", "nigger", "faggot", "retard", "idiot",
    "stupid", "dumb", "hate", "kill", "die", "ugly", "fat", "loser"
  ];

  function containsProfanity(text: string): boolean {
    const lowerText = text.toLowerCase();
    return profanityList.some(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      return regex.test(lowerText);
    });
  }

  // Add a comment to a recipe
  app.post("/api/recipes/:id/comments", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.claims.sub;
      const { id } = req.params;
      
      // Validate with Zod schema
      const parseResult = insertCommentContentSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: parseResult.error.errors[0]?.message || "Invalid comment" });
      }
      
      // Check if user can access this recipe
      const { canAccess, recipe } = await canAccessRecipe(userId, id);
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      if (!canAccess) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Check for profanity
      if (containsProfanity(parseResult.data.content)) {
        return res.status(400).json({ message: "Comment contains inappropriate language" });
      }
      
      // Sanitize content to prevent XSS
      const sanitizedContent = sanitizeHtml(parseResult.data.content);
      const comment = await storage.addComment(userId, id, sanitizedContent);
      res.status(201).json(comment);
    } catch (error) {
      console.error("Error adding comment:", error);
      res.status(500).json({ message: "Failed to add comment" });
    }
  });

  // Hide a comment (recipe owner only)
  app.patch("/api/recipes/:recipeId/comments/:commentId/hide", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.claims.sub;
      const { commentId } = req.params;
      
      const success = await storage.hideComment(parseInt(commentId), userId);
      if (!success) {
        return res.status(403).json({ message: "Cannot hide this comment" });
      }
      
      res.status(200).json({ message: "Comment hidden" });
    } catch (error) {
      console.error("Error hiding comment:", error);
      res.status(500).json({ message: "Failed to hide comment" });
    }
  });

  // Toggle recipe visibility (public/private)
  app.patch("/api/recipes/:id/visibility", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.claims.sub;
      const { id } = req.params;
      
      // Validate with Zod schema
      const parseResult = visibilitySchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: parseResult.error.errors[0]?.message || "Invalid visibility value" });
      }
      
      const recipe = await storage.getRecipe(id);
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      
      // Only recipe creator can change visibility
      if (recipe.createdById !== userId) {
        return res.status(403).json({ message: "Only the recipe creator can change visibility" });
      }
      
      const updated = await storage.updateRecipe(id, { isPublic: parseResult.data.isPublic });
      
      // Sync visibility change to HubSpot (non-blocking)
      // This moves the deal to the Public or Private stage
      (async () => {
        const family = await storage.getFamily(recipe.familyId);
        if (family) {
          await syncRecipeToHubSpot(updated, family.name);
        }
      })().catch(err => {
        console.error("Failed to sync recipe visibility to HubSpot:", err);
      });
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating recipe visibility:", error);
      res.status(500).json({ message: "Failed to update recipe visibility" });
    }
  });

  // Export recipe as PDF
  app.get("/api/recipes/:id/pdf", isAuthenticated, pdfExportLimiter, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.claims.sub;
      const { id } = req.params;
      const scale = parseFloat(req.query.scale as string) || 1;
      
      const recipe = await storage.getRecipeWithCreator(id);
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      
      // Check if user has access
      const isMember = await storage.isFamilyMember(recipe.familyId, userId);
      if (!isMember) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Create PDF
      const doc = new PDFDocument({ margin: 50 });
      
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${recipe.name.replace(/[^a-z0-9]/gi, "_")}.pdf"`);
      
      doc.pipe(res);
      
      // Title
      doc.fontSize(24).font("Helvetica-Bold").text(recipe.name, { align: "center" });
      doc.moveDown();
      
      // Meta info
      doc.fontSize(12).font("Helvetica")
        .text(`Category: ${recipe.category}`, { continued: true })
        .text(`   |   Servings: ${Math.round((recipe.servings || 4) * scale)}`, { continued: true });
      
      if (recipe.prepTime || recipe.cookTime) {
        const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
        doc.text(`   |   Total Time: ${totalTime} min`);
      } else {
        doc.text("");
      }
      
      doc.moveDown(2);
      
      // Groups
      for (const group of recipe.groups) {
        if (recipe.groups.length > 1) {
          doc.fontSize(16).font("Helvetica-Bold").text(group.name);
          doc.moveDown(0.5);
        }
        
        // Ingredients
        doc.fontSize(14).font("Helvetica-Bold").text("Ingredients");
        doc.moveDown(0.5);
        doc.fontSize(11).font("Helvetica");
        
        for (const ing of group.ingredients) {
          const scaledAmount = scaleAmount(ing.amount, scale);
          doc.text(`• ${scaledAmount} ${ing.unit} ${ing.name}`);
        }
        
        doc.moveDown();
        
        // Instructions
        doc.fontSize(14).font("Helvetica-Bold").text("Instructions");
        doc.moveDown(0.5);
        doc.fontSize(11).font("Helvetica");
        
        group.instructions.forEach((step, i) => {
          doc.text(`${i + 1}. ${step}`);
          doc.moveDown(0.5);
        });
        
        doc.moveDown();
      }
      
      doc.end();
    } catch (error) {
      console.error("Error exporting PDF:", error);
      res.status(500).json({ message: "Failed to export PDF" });
    }
  });

  return httpServer;
}
