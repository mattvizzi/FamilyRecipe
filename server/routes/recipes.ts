import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replit_integrations/auth/replitAuth";
import { openai, generateImageBuffer } from "../replit_integrations/image/client";
import { 
  insertRecipeSchema, 
  updateRecipeSchema, 
  recipeCategories, 
  insertCommentContentSchema,
  insertRatingSchema,
  visibilitySchema,
  type RecipeGroup 
} from "@shared/schema";
import PDFDocument from "pdfkit";
import { syncRecipeToHubSpot } from "../hubspot";
import { uploadRecipeImage } from "../imageStorage";
import { scaleAmount } from "@shared/lib/fraction";
import {
  type AuthRequest,
  aiProcessingLimiter,
  pdfExportLimiter,
  publicRateLimiter,
  getUserFamily,
  canAccessRecipe,
  sanitizeHtml
} from "../middleware";

const router = Router();

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

router.get("/", isAuthenticated, async (req: AuthRequest, res: Response) => {
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

router.get("/saved", isAuthenticated, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.claims.sub;
    const recipes = await storage.getSavedRecipes(userId);
    res.json(recipes);
  } catch (error) {
    console.error("Error fetching saved recipes:", error);
    res.status(500).json({ message: "Failed to fetch saved recipes" });
  }
});

router.get("/search", isAuthenticated, async (req: AuthRequest, res: Response) => {
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

router.get("/:id", isAuthenticated, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.claims.sub;
    const { id } = req.params;
    
    const recipe = await storage.getRecipeWithCreator(id);
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }
    
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

router.post("/", isAuthenticated, async (req: AuthRequest, res: Response) => {
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
    
    syncRecipeToHubSpot(recipe, family.name).catch(err => {
      console.error("Failed to sync recipe to HubSpot:", err);
    });
    
    res.status(201).json(recipe);
  } catch (error) {
    console.error("Error creating recipe:", error);
    res.status(500).json({ message: "Failed to create recipe" });
  }
});

router.post("/process", isAuthenticated, aiProcessingLimiter, async (req: AuthRequest, res: Response) => {
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

    type ContentPart = { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } };
    let messages: Array<{ role: "user"; content: ContentPart[] }>;
    
    if ((method === "photo" || method === "camera") && content.includes("data:image")) {
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

    if (!extracted.name || !Array.isArray(extracted.groups) || extracted.groups.length === 0) {
      return res.status(400).json({ message: "Could not extract valid recipe from content" });
    }

    for (const group of extracted.groups) {
      if (!group.name || !Array.isArray(group.ingredients) || !Array.isArray(group.instructions)) {
        return res.status(400).json({ message: "Invalid recipe structure" });
      }
      group.ingredients = group.ingredients.filter((ing: any) => ing && ing.name);
      for (const ing of group.ingredients) {
        ing.amount = ing.amount || "1";
        ing.unit = ing.unit || "";
      }
      group.instructions = group.instructions.filter((step: any) => step && typeof step === "string" && step.trim());
    }

    if (!recipeCategories.includes(extracted.category)) {
      extracted.category = "Dinner";
    }

    const imagePrompt = `Professional food photography of ${extracted.name}. 
Beautifully plated on an elegant white ceramic plate, overhead shot, soft natural lighting, 
garnished elegantly, appetizing and mouthwatering presentation, restaurant quality, 
high-end cookbook style photography, clean minimal background, 8k quality, 
shallow depth of field, food styling.`;

    let imageUrl: string | undefined;
    let imageAltText: string | undefined;
    try {
      const imageBuffer = await generateImageBuffer(imagePrompt, "1024x1024");
      const base64Data = imageBuffer.toString("base64");
      const tempId = `temp-${Date.now()}`;
      imageUrl = await uploadRecipeImage(base64Data, tempId);
      
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
        imageAltText = `${extracted.name} - beautifully plated and ready to serve`;
      }
    } catch (imageError) {
      console.error("Image generation failed:", imageError);
    }

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

    syncRecipeToHubSpot(recipe, family.name).catch(err => {
      console.error("Failed to sync recipe to HubSpot:", err);
    });

    res.status(201).json(recipe);
  } catch (error) {
    console.error("Error processing recipe:", error);
    res.status(500).json({ message: "Failed to process recipe" });
  }
});

router.patch("/:id", isAuthenticated, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.claims.sub;
    const { id } = req.params;
    
    const recipe = await storage.getRecipe(id);
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }
    
    const isMember = await storage.isFamilyMember(recipe.familyId, userId);
    if (!isMember) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    const parseResult = updateRecipeSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ message: "Invalid recipe data", errors: parseResult.error.errors });
    }
    
    const updated = await storage.updateRecipe(id, parseResult.data);
    
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

router.delete("/:id", isAuthenticated, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.claims.sub;
    const { id } = req.params;
    
    const recipe = await storage.getRecipe(id);
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }
    
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

router.get("/:id/stats", isAuthenticated, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.claims.sub;
    const { id } = req.params;
    
    const recipe = await storage.getRecipeWithStats(id, userId);
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }
    
    const isMember = await storage.isFamilyMember(recipe.familyId, userId);
    if (!isMember && !recipe.isPublic) {
      return res.status(403).json({ message: "Access denied" });
    }

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
      await storage.incrementViewCount(id);
    }
    
    res.json(recipe);
  } catch (error) {
    console.error("Error fetching recipe with stats:", error);
    res.status(500).json({ message: "Failed to fetch recipe" });
  }
});

router.post("/:id/save", isAuthenticated, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.claims.sub;
    const { id } = req.params;
    
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

router.delete("/:id/save", isAuthenticated, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.claims.sub;
    const { id } = req.params;
    
    await storage.unsaveRecipe(userId, id);
    res.status(204).send();
  } catch (error) {
    console.error("Error unsaving recipe:", error);
    res.status(500).json({ message: "Failed to unsave recipe" });
  }
});

router.post("/:id/rate", isAuthenticated, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.claims.sub;
    const { id } = req.params;
    
    const parseResult = insertRatingSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ message: parseResult.error.errors[0]?.message || "Invalid rating" });
    }
    
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

router.post("/:id/cook", isAuthenticated, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.claims.sub;
    const { id } = req.params;
    
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

router.get("/:id/comments", isAuthenticated, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.claims.sub;
    const { id } = req.params;
    
    const { canAccess, recipe } = await canAccessRecipe(userId, id);
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }
    if (!canAccess) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    const showHidden = recipe.createdById === userId;
    const comments = await storage.getComments(id, showHidden);
    res.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ message: "Failed to fetch comments" });
  }
});

router.post("/:id/comments", isAuthenticated, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.claims.sub;
    const { id } = req.params;
    
    const parseResult = insertCommentContentSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ message: parseResult.error.errors[0]?.message || "Invalid comment" });
    }
    
    const { canAccess, recipe } = await canAccessRecipe(userId, id);
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }
    if (!canAccess) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    if (containsProfanity(parseResult.data.content)) {
      return res.status(400).json({ message: "Comment contains inappropriate language" });
    }
    
    const sanitizedContent = sanitizeHtml(parseResult.data.content);
    const comment = await storage.addComment(userId, id, sanitizedContent);
    res.status(201).json(comment);
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ message: "Failed to add comment" });
  }
});

router.patch("/:recipeId/comments/:commentId/hide", isAuthenticated, async (req: AuthRequest, res: Response) => {
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

router.patch("/:id/visibility", isAuthenticated, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.claims.sub;
    const { id } = req.params;
    
    const parseResult = visibilitySchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ message: parseResult.error.errors[0]?.message || "Invalid visibility value" });
    }
    
    const recipe = await storage.getRecipe(id);
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }
    
    if (recipe.createdById !== userId) {
      return res.status(403).json({ message: "Only the recipe creator can change visibility" });
    }
    
    const updated = await storage.updateRecipe(id, { isPublic: parseResult.data.isPublic });
    
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

router.get("/:id/pdf", isAuthenticated, pdfExportLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.claims.sub;
    const { id } = req.params;
    const scale = parseFloat(req.query.scale as string) || 1;
    
    const recipe = await storage.getRecipeWithCreator(id);
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }
    
    const isMember = await storage.isFamilyMember(recipe.familyId, userId);
    if (!isMember) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${recipe.name.replace(/[^a-z0-9]/gi, "_")}.pdf"`);
    
    doc.pipe(res);
    
    doc.fontSize(24).font("Helvetica-Bold").text(recipe.name, { align: "center" });
    doc.moveDown();
    
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
    
    for (const group of recipe.groups) {
      if (recipe.groups.length > 1) {
        doc.fontSize(16).font("Helvetica-Bold").text(group.name);
        doc.moveDown(0.5);
      }
      
      doc.fontSize(14).font("Helvetica-Bold").text("Ingredients");
      doc.moveDown(0.5);
      doc.fontSize(11).font("Helvetica");
      
      for (const ing of group.ingredients) {
        const scaledAmount = scaleAmount(ing.amount, scale);
        doc.text(`• ${scaledAmount} ${ing.unit} ${ing.name}`);
      }
      
      doc.moveDown();
      
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

export default router;

export const publicRecipesRouter = Router();

publicRecipesRouter.get("/recipes", publicRateLimiter, async (req: Request, res: Response) => {
  try {
    const category = req.query.category as string | undefined;
    const recipes = await storage.getPublicRecipes(category);
    res.json(recipes);
  } catch (error) {
    console.error("Error fetching public recipes:", error);
    res.status(500).json({ message: "Failed to fetch public recipes" });
  }
});
