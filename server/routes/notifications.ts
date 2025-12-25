import { Router, Response } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replit_integrations/auth/replitAuth";
import { type AuthRequest } from "../middleware";

const router = Router();

router.get("/", isAuthenticated, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.claims.sub;
    const notifications = await storage.getNotificationsForUser(userId);
    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

router.get("/unread-count", isAuthenticated, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.claims.sub;
    const count = await storage.getUnreadCountForUser(userId);
    res.json({ count });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ message: "Failed to fetch unread count" });
  }
});

router.post("/:id/read", isAuthenticated, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.claims.sub;
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid notification ID" });
    }
    
    const success = await storage.markNotificationRead(id, userId);
    if (!success) {
      return res.status(404).json({ message: "Notification not found" });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error marking notification read:", error);
    res.status(500).json({ message: "Failed to mark notification read" });
  }
});

router.post("/mark-all-read", isAuthenticated, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.claims.sub;
    await storage.markAllNotificationsRead(userId);
    res.json({ success: true });
  } catch (error) {
    console.error("Error marking all notifications read:", error);
    res.status(500).json({ message: "Failed to mark notifications read" });
  }
});

export default router;
