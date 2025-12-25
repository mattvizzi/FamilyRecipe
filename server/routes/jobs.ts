import { Router, Response } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replit_integrations/auth/replitAuth";
import { type AuthRequest } from "../middleware";

const router = Router();

router.get("/:id/status", isAuthenticated, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.claims.sub;
    const { id } = req.params;
    
    const job = await storage.getProcessingJob(id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    
    if (job.userId !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    res.json({
      id: job.id,
      status: job.status,
      extractedData: job.extractedData,
      errorMessage: job.errorMessage,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
    });
  } catch (error) {
    console.error("Error fetching job status:", error);
    res.status(500).json({ message: "Failed to fetch job status" });
  }
});

router.get("/active", isAuthenticated, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.claims.sub;
    const jobs = await storage.getActiveJobsForUser(userId);
    res.json(jobs);
  } catch (error) {
    console.error("Error fetching active jobs:", error);
    res.status(500).json({ message: "Failed to fetch active jobs" });
  }
});

export default router;
