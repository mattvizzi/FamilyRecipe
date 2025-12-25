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
  getHubSpotCompanyByFamilyId,
  setupHubSpotProperties
} from "./hubspot";
import { uploadRecipeImage, isBase64Image } from "./imageStorage";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";

// Rate limiters for expensive operations
const aiProcessingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 AI processing requests per 15 minutes per user
  message: { message: "Too many recipe processing requests. Please wait before trying again." },
  standardHeaders: true,
  legacyHeaders: false,
  validate: false, // Disable all validation warnings
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
  validate: false,
  keyGenerator: (req: Request) => {
    const authReq = req as AuthRequest;
    return authReq.user?.claims?.sub || req.ip || 'unknown';
  },
});

// Rate limiter for public endpoints (no auth required)
const publicRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes per IP
  message: { message: "Too many requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  keyGenerator: (req: Request) => req.ip || 'unknown',
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
    viewedRecipes?: string[]; // Track viewed recipes to prevent view count inflation
  } & Request['session'];
}

// Admin authentication middleware
const isAdmin: RequestHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user?.claims?.sub) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  
  const userId = req.user.claims.sub;
  const adminStatus = await storage.isAdmin(userId);
  
  if (!adminStatus) {
    return res.status(403).json({ message: "Admin access required" });
  }
  
  next();
};

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
  
  // Register object storage routes for serving uploaded images
  registerObjectStorageRoutes(app);
  
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

  // Search recipes (family + public) - MUST be before /api/recipes/:id
  app.get("/api/recipes/search", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.claims.sub;
      const query = (req.query.q as string) || "";
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
      
      if (!query.trim()) {
        return res.json([]);
      }
      
      const recipes = await storage.searchRecipes(userId, query.trim(), limit);
      res.json(recipes);
    } catch (error) {
      console.error("Error searching recipes:", error);
      res.status(500).json({ message: "Failed to search recipes" });
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
      
      // Build the extraction prompt with SEO fields
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
  ],
  "metaDescription": "A compelling 150-160 character SEO description that entices users to try this recipe. Include key ingredients and cooking method.",
  "seoKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}

For complex recipes like "Spaghetti and Meatballs", create separate groups for each component.
Use fractions for amounts where appropriate (e.g., "1/2", "1 1/2").
Choose the most appropriate category based on the recipe.

SEO Guidelines:
- metaDescription: Write an enticing 150-160 character description focusing on taste, key ingredients, and ease of preparation. Use action words like "discover", "savor", "enjoy".
- seoKeywords: Generate 5-8 relevant search keywords including cuisine type, main ingredients, cooking method, dietary info (if applicable), occasion, and related search terms users might use.
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
      let imageAltText: string | undefined;
      try {
        const imageBuffer = await generateImageBuffer(imagePrompt, "1024x1024");
        // Upload to Object Storage instead of storing base64 in database
        const base64Data = imageBuffer.toString("base64");
        // Generate a temporary ID for the image (will be updated after recipe is created)
        const tempId = `temp-${Date.now()}`;
        imageUrl = await uploadRecipeImage(base64Data, tempId);
        
        // Generate SEO-optimized alt text for the image using AI vision
        try {
          const altTextCompletion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{
              role: "user",
              content: [
                { type: "text", text: `Generate a concise, SEO-friendly alt text (max 125 characters) for this recipe image of "${extracted.name}". Focus on describing the dish's appearance, key ingredients visible, and presentation style. Do not include phrases like "image of" or "photo of".` },
                { type: "image_url", image_url: { url: `data:image/png;base64,${base64Data}` } }
              ]
            }],
          });
          imageAltText = altTextCompletion.choices[0]?.message?.content?.trim();
        } catch (altTextError) {
          console.error("Alt text generation failed:", altTextError);
          // Fallback to recipe name
          imageAltText = `${extracted.name} - beautifully plated and ready to serve`;
        }
      } catch (imageError) {
        console.error("Image generation failed:", imageError);
        // Continue without image
      }

      // Create the recipe with SEO fields
      const recipe = await storage.createRecipe(family.id, userId, {
        name: extracted.name,
        category: extracted.category,
        prepTime: extracted.prepTime || null,
        cookTime: extracted.cookTime || null,
        servings: extracted.servings || 4,
        imageUrl,
        groups: extracted.groups,
        metaDescription: extracted.metaDescription || null,
        seoKeywords: Array.isArray(extracted.seoKeywords) ? extracted.seoKeywords : null,
        imageAltText: imageAltText || null,
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

      // Increment view count only if not already viewed in this session
      const authReq = req as AuthRequest;
      if (authReq.session) {
        if (!authReq.session.viewedRecipes) {
          authReq.session.viewedRecipes = [];
        }
        if (!authReq.session.viewedRecipes.includes(id)) {
          await storage.incrementViewCount(id);
          authReq.session.viewedRecipes.push(id);
        }
      } else {
        // No session, increment anyway (fallback)
        await storage.incrementViewCount(id);
      }
      
      res.json(recipe);
    } catch (error) {
      console.error("Error fetching recipe with stats:", error);
      res.status(500).json({ message: "Failed to fetch recipe" });
    }
  });

  // Get public recipes (all or by category) - rate limited to prevent abuse
  app.get("/api/public/recipes", publicRateLimiter, async (req: Request, res: Response) => {
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

  // ============ ADMIN ROUTES ============
  
  // Check if current user is admin
  app.get("/api/admin/check", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.claims.sub;
      const adminStatus = await storage.isAdmin(userId);
      if (!adminStatus) {
        res.status(403).json({ isAdmin: false, message: "Forbidden" });
        return;
      }
      res.json({ isAdmin: true });
    } catch (error) {
      console.error("Error checking admin status:", error);
      res.status(500).json({ message: "Failed to check admin status" });
    }
  });

  // Admin dashboard stats
  app.get("/api/admin/stats", isAuthenticated, isAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Get all users (admin only)
  app.get("/api/admin/users", isAuthenticated, isAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Get all families (admin only)
  app.get("/api/admin/families", isAuthenticated, isAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const families = await storage.getAllFamiliesWithStats();
      res.json(families);
    } catch (error) {
      console.error("Error fetching families:", error);
      res.status(500).json({ message: "Failed to fetch families" });
    }
  });

  // Get all recipes (admin only)
  app.get("/api/admin/recipes", isAuthenticated, isAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const recipes = await storage.getAllRecipesAdmin();
      res.json(recipes);
    } catch (error) {
      console.error("Error fetching recipes:", error);
      res.status(500).json({ message: "Failed to fetch recipes" });
    }
  });

  // Set noindex header for admin routes (middleware for frontend)
  app.use("/admin", (req: Request, res: Response, next: NextFunction) => {
    res.setHeader("X-Robots-Tag", "noindex, nofollow");
    next();
  });

  // Admin toggle user admin status
  app.post("/api/admin/users/:id/toggle-admin", isAuthenticated, isAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.params.id;
      const isCurrentlyAdmin = await storage.isAdmin(userId);
      
      if (isCurrentlyAdmin) {
        await storage.removeAdmin(userId);
        res.json({ isAdmin: false });
      } else {
        await storage.addAdmin(userId);
        res.json({ isAdmin: true });
      }
    } catch (error) {
      console.error("Error toggling admin status:", error);
      res.status(500).json({ message: "Failed to toggle admin status" });
    }
  });

  // Admin toggle recipe visibility
  app.post("/api/admin/recipes/:id/toggle-visibility", isAuthenticated, isAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const result = await storage.adminToggleRecipeVisibility(req.params.id);
      if (!result) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      res.json(result);
    } catch (error) {
      console.error("Error toggling recipe visibility:", error);
      res.status(500).json({ message: "Failed to toggle visibility" });
    }
  });

  // Admin delete recipe
  app.delete("/api/admin/recipes/:id", isAuthenticated, isAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const result = await storage.adminDeleteRecipe(req.params.id);
      if (!result) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting recipe:", error);
      res.status(500).json({ message: "Failed to delete recipe" });
    }
  });

  // Get all comments (admin only)
  app.get("/api/admin/comments", isAuthenticated, isAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const comments = await storage.getAllCommentsAdmin();
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  // Admin toggle comment hidden status
  app.post("/api/admin/comments/:id/toggle-hidden", isAuthenticated, isAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const commentId = parseInt(req.params.id, 10);
      if (isNaN(commentId)) {
        return res.status(400).json({ message: "Invalid comment ID" });
      }
      
      const result = await storage.adminToggleCommentHidden(commentId);
      if (!result) {
        return res.status(404).json({ message: "Comment not found" });
      }
      res.json(result);
    } catch (error) {
      console.error("Error toggling comment hidden:", error);
      res.status(500).json({ message: "Failed to toggle comment" });
    }
  });

  // Admin delete comment
  app.delete("/api/admin/comments/:id", isAuthenticated, isAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const commentId = parseInt(req.params.id, 10);
      if (isNaN(commentId)) {
        return res.status(400).json({ message: "Invalid comment ID" });
      }
      
      const result = await storage.adminDeleteComment(commentId);
      if (!result) {
        return res.status(404).json({ message: "Comment not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  // Admin HubSpot setup endpoint - creates custom properties
  app.post("/api/admin/hubspot/setup", isAuthenticated, isAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const results = await setupHubSpotProperties();
      res.json({ success: true, results });
    } catch (error) {
      console.error("Error setting up HubSpot properties:", error);
      res.status(500).json({ message: "Failed to setup HubSpot properties" });
    }
  });

  // Admin HubSpot sync endpoints
  app.post("/api/admin/hubspot/sync/users", isAuthenticated, isAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      let synced = 0;
      let failed = 0;
      
      for (const user of users) {
        if (user.email) {
          const result = await syncUserToHubSpot(user as any);
          if (result) synced++;
          else failed++;
        }
      }
      
      res.json({ success: true, synced, failed, total: users.length });
    } catch (error) {
      console.error("Error syncing users to HubSpot:", error);
      res.status(500).json({ message: "Failed to sync users" });
    }
  });

  app.post("/api/admin/hubspot/sync/families", isAuthenticated, isAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const families = await storage.getAllFamiliesWithStats();
      let synced = 0;
      let failed = 0;
      
      for (const family of families) {
        const result = await syncFamilyToHubSpot(family as any);
        if (result) synced++;
        else failed++;
      }
      
      res.json({ success: true, synced, failed, total: families.length });
    } catch (error) {
      console.error("Error syncing families to HubSpot:", error);
      res.status(500).json({ message: "Failed to sync families" });
    }
  });

  app.post("/api/admin/hubspot/sync/recipes", isAuthenticated, isAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const recipes = await storage.getAllRecipesAdmin();
      let synced = 0;
      let failed = 0;
      
      for (const recipe of recipes) {
        const result = await syncRecipeToHubSpot(recipe as any, recipe.familyName || "Unknown");
        if (result) synced++;
        else failed++;
      }
      
      res.json({ success: true, synced, failed, total: recipes.length });
    } catch (error) {
      console.error("Error syncing recipes to HubSpot:", error);
      res.status(500).json({ message: "Failed to sync recipes" });
    }
  });

  app.post("/api/admin/hubspot/sync/all", isAuthenticated, isAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const [users, families, recipes] = await Promise.all([
        storage.getAllUsers(),
        storage.getAllFamiliesWithStats(),
        storage.getAllRecipesAdmin(),
      ]);
      
      const results = { users: { synced: 0, failed: 0 }, families: { synced: 0, failed: 0 }, recipes: { synced: 0, failed: 0 } };
      
      for (const user of users) {
        if (user.email) {
          const r = await syncUserToHubSpot(user as any);
          if (r) results.users.synced++; else results.users.failed++;
        }
      }
      
      for (const family of families) {
        const r = await syncFamilyToHubSpot(family as any);
        if (r) results.families.synced++; else results.families.failed++;
      }
      
      for (const recipe of recipes) {
        const r = await syncRecipeToHubSpot(recipe as any, recipe.familyName || "Unknown");
        if (r) results.recipes.synced++; else results.recipes.failed++;
      }
      
      res.json({ success: true, results });
    } catch (error) {
      console.error("Error syncing all to HubSpot:", error);
      res.status(500).json({ message: "Failed to sync all data" });
    }
  });

  // Admin AI Chat endpoint
  app.post("/api/admin/chat", isAuthenticated, isAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const { message, history = [] } = req.body;
      
      if (!message || typeof message !== "string") {
        return res.status(400).json({ message: "Message is required" });
      }

      // Gather admin context
      const [stats, users, families, recipes] = await Promise.all([
        storage.getAdminStats(),
        storage.getAllUsers(),
        storage.getAllFamiliesWithStats(),
        storage.getAllRecipesAdmin(),
      ]);

      // Create context summary
      const contextSummary = `
## Platform Overview
- Total Users: ${stats.totalUsers}
- Total Families: ${stats.totalFamilies}
- Total Recipes: ${stats.totalRecipes}
- Public Recipes: ${stats.publicRecipes}
- Users joined in last 7 days: ${stats.recentUsers}
- Recipes created in last 7 days: ${stats.recentRecipes}

## Recent Users (last 10)
${users.slice(0, 10).map(u => `- ${u.firstName || ''} ${u.lastName || ''} (${u.email || 'no email'}) - ${u.recipeCount} recipes, Family: ${u.familyName || 'None'}`).join('\n')}

## Families Overview (top 10 by recipe count)
${[...families].sort((a, b) => b.recipeCount - a.recipeCount).slice(0, 10).map(f => `- ${f.name}: ${f.memberCount} members, ${f.recipeCount} recipes`).join('\n')}

## Recipe Categories
${Object.entries(recipes.reduce((acc: Record<string, number>, r) => {
  acc[r.category] = (acc[r.category] || 0) + 1;
  return acc;
}, {})).map(([cat, count]) => `- ${cat}: ${count}`).join('\n')}

## Top 10 Recipes by Views
${[...recipes].sort((a, b) => b.viewCount - a.viewCount).slice(0, 10).map(r => `- ${r.name} (${r.viewCount} views, ${r.isPublic ? 'public' : 'private'}) by ${r.creatorName || 'Unknown'}`).join('\n')}
`;

      const systemPrompt = `You are an AI assistant for the Family Recipe platform admin dashboard. You have access to real-time platform data and can help administrators understand trends, identify issues, and make decisions.

Here is the current platform data:
${contextSummary}

Be concise and helpful. When asked about specific metrics, reference the actual data above. If asked to perform actions, explain what would need to be done but note that you cannot directly modify the database.`;

      // Build messages for OpenAI
      const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
        { role: "system", content: systemPrompt },
        ...history.map((h: { role: string; content: string }) => ({
          role: h.role as "user" | "assistant",
          content: h.content,
        })),
        { role: "user", content: message },
      ];

      // Set up SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();

      const stream = await openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        stream: true,
        max_completion_tokens: 1024,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      res.write("data: [DONE]\n\n");
      res.end();
    } catch (error) {
      console.error("Error in admin chat:", error);
      if (!res.headersSent) {
        res.status(500).json({ message: "Failed to process chat request" });
      } else {
        res.write(`data: ${JSON.stringify({ error: "An error occurred" })}\n\n`);
        res.end();
      }
    }
  });

  // Get admin context summary for AI (can be used for debugging)
  app.get("/api/admin/context", isAuthenticated, isAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const [stats, users, families, recipes] = await Promise.all([
        storage.getAdminStats(),
        storage.getAllUsers(),
        storage.getAllFamiliesWithStats(),
        storage.getAllRecipesAdmin(),
      ]);

      res.json({
        stats,
        recentUsers: users.slice(0, 10),
        topFamilies: [...families].sort((a, b) => b.recipeCount - a.recipeCount).slice(0, 10),
        topRecipes: [...recipes].sort((a, b) => b.viewCount - a.viewCount).slice(0, 10),
        categoryCounts: recipes.reduce((acc: Record<string, number>, r) => {
          acc[r.category] = (acc[r.category] || 0) + 1;
          return acc;
        }, {}),
      });
    } catch (error) {
      console.error("Error fetching admin context:", error);
      res.status(500).json({ message: "Failed to fetch context" });
    }
  });

  return httpServer;
}
