import express from "express";
import { 
  issueMaterial, 
  returnMaterial, 
  getMovementLogs,
  generateMovementReport,
  getMovementStats,
  disposeMaterial,
  getExpiredItems
} from "../controllers/movementLogController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = express.Router();

// Movement Log Routes
router.post("/issue", authMiddleware, roleMiddleware(["Store Manager"]), issueMaterial);
router.post("/return", authMiddleware, roleMiddleware(["Store Manager"]), returnMaterial);
router.post("/dispose", authMiddleware, roleMiddleware(["Store Manager"]), disposeMaterial);
router.get("/", authMiddleware, roleMiddleware(["Admin", "Store Manager"]), getMovementLogs);
router.get("/stats", authMiddleware, getMovementStats);
router.get("/report", authMiddleware, roleMiddleware(["Admin", "Store Manager"]), generateMovementReport);
router.get("/expired", authMiddleware, roleMiddleware(["Admin", "Store Manager"]), getExpiredItems);

export default router;