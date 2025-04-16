import express from "express";
import { 
  issueMaterial, 
  returnMaterial, 
  getMovementLogs 
} from "../controllers/movementLogController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = express.Router();

// Issue material (Store Manager only)
router.post("/issue", authMiddleware, roleMiddleware(["Store Manager"]), issueMaterial);

// Return material (Store Manager only)
router.post("/return", authMiddleware, roleMiddleware(["Store Manager"]), returnMaterial);

// Get movement logs (Store Manager & Admin)
router.get("/", authMiddleware, roleMiddleware(["Store Manager", "Admin"]), getMovementLogs);

export default router;