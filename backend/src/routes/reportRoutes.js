import { Router } from "express";
import { createReport, listReports, listResources, listReviewQueue, reviewReport } from "../controllers/reportController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = Router();

router.get("/", listReports);
router.get("/resources", listResources);
router.get("/review-queue", requireAuth, requireRole("admin"), listReviewQueue);
router.post("/", requireAuth, upload.single("photo"), createReport);
router.patch("/:reportId/review", requireAuth, requireRole("admin"), reviewReport);

export default router;
