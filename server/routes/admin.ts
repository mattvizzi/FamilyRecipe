import { Router, Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replit_integrations/auth/replitAuth";
import { openai } from "../replit_integrations/image/client";
import { 
  syncFamilyToHubSpot, 
  syncRecipeToHubSpot,
  syncUserToHubSpot,
  setupHubSpotProperties
} from "../hubspot";
import { type AuthRequest, isAdmin } from "../middleware";

const router = Router();

router.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  next();
});

router.get("/check", isAuthenticated, async (req: AuthRequest, res: Response) => {
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

router.get("/stats", isAuthenticated, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const stats = await storage.getAdminStats();
    res.json(stats);
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    res.status(500).json({ message: "Failed to fetch stats" });
  }
});

router.get("/users", isAuthenticated, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const users = await storage.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

router.get("/families", isAuthenticated, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const families = await storage.getAllFamiliesWithStats();
    res.json(families);
  } catch (error) {
    console.error("Error fetching families:", error);
    res.status(500).json({ message: "Failed to fetch families" });
  }
});

router.get("/recipes", isAuthenticated, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const recipes = await storage.getAllRecipesAdmin();
    res.json(recipes);
  } catch (error) {
    console.error("Error fetching recipes:", error);
    res.status(500).json({ message: "Failed to fetch recipes" });
  }
});

router.post("/users/:id/toggle-admin", isAuthenticated, isAdmin, async (req: AuthRequest, res: Response) => {
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

router.post("/recipes/:id/toggle-visibility", isAuthenticated, isAdmin, async (req: AuthRequest, res: Response) => {
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

router.delete("/recipes/:id", isAuthenticated, isAdmin, async (req: AuthRequest, res: Response) => {
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

router.get("/comments", isAuthenticated, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const comments = await storage.getAllCommentsAdmin();
    res.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ message: "Failed to fetch comments" });
  }
});

router.post("/comments/:id/toggle-hidden", isAuthenticated, isAdmin, async (req: AuthRequest, res: Response) => {
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

router.delete("/comments/:id", isAuthenticated, isAdmin, async (req: AuthRequest, res: Response) => {
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

router.post("/hubspot/setup", isAuthenticated, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const results = await setupHubSpotProperties();
    res.json({ success: true, results });
  } catch (error) {
    console.error("Error setting up HubSpot properties:", error);
    res.status(500).json({ message: "Failed to setup HubSpot properties" });
  }
});

router.post("/hubspot/sync/users", isAuthenticated, isAdmin, async (req: AuthRequest, res: Response) => {
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

router.post("/hubspot/sync/families", isAuthenticated, isAdmin, async (req: AuthRequest, res: Response) => {
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

router.post("/hubspot/sync/recipes", isAuthenticated, isAdmin, async (req: AuthRequest, res: Response) => {
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

router.post("/hubspot/sync/all", isAuthenticated, isAdmin, async (req: AuthRequest, res: Response) => {
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

router.post("/chat", isAuthenticated, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { message, history = [] } = req.body;
    
    if (!message || typeof message !== "string") {
      return res.status(400).json({ message: "Message is required" });
    }

    const [stats, users, families, recipes] = await Promise.all([
      storage.getAdminStats(),
      storage.getAllUsers(),
      storage.getAllFamiliesWithStats(),
      storage.getAllRecipesAdmin(),
    ]);

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

    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: systemPrompt },
      ...history.map((h: { role: string; content: string }) => ({
        role: h.role as "user" | "assistant",
        content: h.content,
      })),
      { role: "user", content: message },
    ];

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

router.get("/context", isAuthenticated, isAdmin, async (req: AuthRequest, res: Response) => {
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

export default router;
