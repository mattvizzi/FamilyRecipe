import { Router, Response } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replit_integrations/auth/replitAuth";
import { authStorage } from "../replit_integrations/auth/storage";
import { familyNameSchema } from "@shared/schema";
import { 
  syncFamilyToHubSpot, 
  associateContactWithCompany,
  getHubSpotContactByEmail,
  getHubSpotCompanyByFamilyId
} from "../hubspot";
import { type AuthRequest, getUserFamily } from "../middleware";

const router = Router();

router.get("/", isAuthenticated, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.claims.sub;
    const family = await getUserFamily(userId);
    res.json(family || null);
  } catch (error) {
    console.error("Error fetching family:", error);
    res.status(500).json({ message: "Failed to fetch family" });
  }
});

router.get("/details", isAuthenticated, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.claims.sub;
    const family = await getUserFamily(userId);
    
    if (!family) {
      return res.json(null);
    }
    
    const familyWithMembers = await storage.getFamilyWithMembers(family.id);
    res.json(familyWithMembers);
  } catch (error) {
    console.error("Error fetching family details:", error);
    res.status(500).json({ message: "Failed to fetch family details" });
  }
});

router.post("/", isAuthenticated, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.claims.sub;
    
    const parseResult = familyNameSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ message: parseResult.error.errors[0]?.message || "Invalid family name" });
    }
    
    const existingFamily = await getUserFamily(userId);
    if (existingFamily) {
      return res.status(400).json({ message: "You already belong to a family" });
    }
    
    const family = await storage.createFamily(parseResult.data.name, userId);
    
    syncFamilyToHubSpot(family).then(async (companyId) => {
      if (companyId) {
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

router.patch("/", isAuthenticated, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.claims.sub;
    
    const parseResult = familyNameSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ message: parseResult.error.errors[0]?.message || "Invalid family name" });
    }
    
    const family = await getUserFamily(userId);
    if (!family) {
      return res.status(404).json({ message: "No family found" });
    }
    
    const updated = await storage.updateFamily(family.id, parseResult.data.name);
    
    syncFamilyToHubSpot(updated).catch(err => {
      console.error("Failed to sync updated family to HubSpot:", err);
    });
    
    res.json(updated);
  } catch (error) {
    console.error("Error updating family:", error);
    res.status(500).json({ message: "Failed to update family" });
  }
});

router.get("/invite/:code", isAuthenticated, async (req: AuthRequest, res: Response) => {
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

router.post("/join/:code", isAuthenticated, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.claims.sub;
    const { code } = req.params;
    
    const existingFamily = await getUserFamily(userId);
    if (existingFamily) {
      return res.status(400).json({ message: "You already belong to a family" });
    }
    
    const family = await storage.getFamilyByInviteCode(code);
    if (!family) {
      return res.status(404).json({ message: "Invalid invite code" });
    }
    
    await storage.addFamilyMember(family.id, userId);
    
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

export default router;
