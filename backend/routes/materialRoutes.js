import express from "express";
import { 
  addMaterial, 
  updateMaterial, 
  deleteMaterial, 
  getAllMaterials, 
  getMaterialById,
  getExpiringMaterials,
  addMaterialBatch,
  updateMaterialBatch,
  disposeMaterial,
  searchMaterials
} from "../controllers/materialContollers.js";
import {authMiddleware} from "../middlewares/authMiddleware.js";
import {roleMiddleware} from "../middlewares/roleMiddleware.js";

const router = express.Router();

// Basic Material CRUD
router.post("/", authMiddleware, roleMiddleware(["Store Manager"]), addMaterial);
router.put("/:id", authMiddleware, roleMiddleware(["Store Manager"]), updateMaterial);
router.get('/search', authMiddleware, searchMaterials);
router.delete("/:id", authMiddleware, roleMiddleware(["Admin", "Store Manager"]), deleteMaterial);
router.get("/", authMiddleware, roleMiddleware(["Admin", "Store Manager", "Doctor", "Staff"]), getAllMaterials);
router.get("/:id", authMiddleware, roleMiddleware(["Admin", "Store Manager", "Doctor", "Staff"]), getMaterialById);

// Batch Management
router.post("/:id/batches", authMiddleware, roleMiddleware(["Store Manager"]), addMaterialBatch);
router.put("/:id/batches/:batchId", authMiddleware, roleMiddleware(["Store Manager"]), updateMaterialBatch);

// Disposal/Waste Management
router.post("/:id/dispose", authMiddleware, roleMiddleware(["Store Manager"]), disposeMaterial);

// Alert Endpoints
router.get("/alerts/expiring", authMiddleware, roleMiddleware(["Admin", "Store Manager"]), getExpiringMaterials);

export default router;