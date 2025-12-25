import type { Express, Response } from "express";
import { type Server } from "http";
import { setupAuth, isAuthenticated } from "./replit_integrations/auth/replitAuth";
import { registerAuthRoutes } from "./replit_integrations/auth/routes";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { type AuthRequest, validateCsrf, generateCsrfToken } from "./middleware";

import familyRouter from "./routes/family";
import recipesRouter, { publicRecipesRouter } from "./routes/recipes";
import adminRouter from "./routes/admin";
import userRouter from "./routes/user";
import notificationsRouter from "./routes/notifications";
import jobsRouter from "./routes/jobs";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  await setupAuth(app);
  registerAuthRoutes(app);
  registerObjectStorageRoutes(app);
  
  app.get("/api/csrf-token", isAuthenticated, (req: AuthRequest, res: Response) => {
    if (!req.session!.csrfToken) {
      req.session!.csrfToken = generateCsrfToken();
    }
    res.json({ csrfToken: req.session!.csrfToken });
  });
  
  // Public routes - no CSRF or auth required
  app.use("/api/public", publicRecipesRouter);
  
  // Apply CSRF validation to all other API routes
  app.use("/api", validateCsrf);
  
  // Protected routes
  app.use("/api/user", userRouter);
  app.use("/api/family", familyRouter);
  app.use("/api/recipes", recipesRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/notifications", notificationsRouter);
  app.use("/api/jobs", jobsRouter);

  return httpServer;
}
