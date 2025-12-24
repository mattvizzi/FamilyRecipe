import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replit_integrations/auth/replitAuth";
import { registerAuthRoutes } from "./replit_integrations/auth/routes";
import { openai, generateImageBuffer } from "./replit_integrations/image/client";
import { insertRecipeSchema, updateRecipeSchema, recipeCategories, type RecipeGroup } from "@shared/schema";
import PDFDocument from "pdfkit";
import { scaleAmount } from "./lib/fraction";

interface AuthRequest extends Request {
  user?: {
    claims: {
      sub: string;
    };
  };
}

// Helper to get user's family
async function getUserFamily(userId: string) {
  return storage.getFamilyByMember(userId);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Initialize authentication
  await setupAuth(app);
  registerAuthRoutes(app);
  
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
      const { name } = req.body;
      
      if (!name || typeof name !== "string") {
        return res.status(400).json({ message: "Family name is required" });
      }
      
      // Check if user already has a family
      const existingFamily = await getUserFamily(userId);
      if (existingFamily) {
        return res.status(400).json({ message: "You already belong to a family" });
      }
      
      const family = await storage.createFamily(name.trim(), userId);
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
      const { name } = req.body;
      
      if (!name || typeof name !== "string") {
        return res.status(400).json({ message: "Family name is required" });
      }
      
      const family = await getUserFamily(userId);
      if (!family) {
        return res.status(404).json({ message: "No family found" });
      }
      
      const updated = await storage.updateFamily(family.id, name.trim());
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
      res.status(201).json(recipe);
    } catch (error) {
      console.error("Error creating recipe:", error);
      res.status(500).json({ message: "Failed to create recipe" });
    }
  });

  // Process recipe with AI
  app.post("/api/recipes/process", isAuthenticated, async (req: AuthRequest, res: Response) => {
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

  // Export recipe as PDF
  app.get("/api/recipes/:id/pdf", isAuthenticated, async (req: AuthRequest, res: Response) => {
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
