import type { Request, Response, NextFunction } from "express";
import { randomBytes } from "crypto";
import rateLimit from "express-rate-limit";
import { storage } from "./storage";

export interface AuthRequest extends Request {
  user?: {
    claims: {
      sub: string;
    };
  };
  session?: {
    csrfToken?: string;
    viewedRecipes?: string[];
  } & Request['session'];
}

type AuthMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => void | Promise<void>;

export const aiProcessingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many recipe processing requests. Please wait before trying again." },
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  keyGenerator: (req: Request) => {
    const authReq = req as AuthRequest;
    return authReq.user?.claims?.sub || req.ip || 'unknown';
  },
});

export const pdfExportLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20,
  message: { message: "Too many PDF export requests. Please wait before trying again." },
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  keyGenerator: (req: Request) => {
    const authReq = req as AuthRequest;
    return authReq.user?.claims?.sub || req.ip || 'unknown';
  },
});

export const publicRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: "Too many requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  keyGenerator: (req: Request) => req.ip || 'unknown',
});

export const isAdmin: AuthMiddleware = async (req, res, next) => {
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

export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex');
}

export const validateCsrf: AuthMiddleware = (req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const sessionToken = req.session?.csrfToken;
    const headerToken = req.headers['x-csrf-token'] as string;
    
    if (!sessionToken) {
      return res.status(403).json({ message: 'CSRF token not initialized. Please refresh and try again.' });
    }
    
    if (sessionToken !== headerToken) {
      return res.status(403).json({ message: 'Invalid CSRF token' });
    }
  }
  next();
};

export async function getUserFamily(userId: string) {
  return storage.getFamilyByMember(userId);
}

export async function canAccessRecipe(userId: string, recipeId: string): Promise<{ canAccess: boolean; recipe: Awaited<ReturnType<typeof storage.getRecipe>> }> {
  const recipe = await storage.getRecipe(recipeId);
  if (!recipe) {
    return { canAccess: false, recipe: undefined };
  }
  
  if (recipe.isPublic) {
    return { canAccess: true, recipe };
  }
  
  const isMember = await storage.isFamilyMember(recipe.familyId, userId);
  return { canAccess: isMember, recipe };
}

export function sanitizeHtml(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}
