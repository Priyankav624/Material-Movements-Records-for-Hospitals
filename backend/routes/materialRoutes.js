import express from "express";
import { addMaterial, updateMaterial, deleteMaterial, getAllMaterials, getMaterialById } from "../controllers/materialContollers.js";
import {authMiddleware} from "../middlewares/authMiddleware.js";
import {roleMiddleware} from "../middlewares/roleMiddleware.js";

const router = express.Router();

// Add Material (Only Store Manager)
router.post("/", authMiddleware, roleMiddleware(["Store Manager"]), addMaterial);

// Update Material (Only Store Manager)
router.put("/:id", authMiddleware, roleMiddleware(["Store Manager"]), updateMaterial);

// Delete Material (Only Admin & Store Manager)
router.delete("/:id", authMiddleware, roleMiddleware(["Admin", "Store Manager"]), deleteMaterial);

// Get All Materials (Admin, Store Manager, Doctor, Staff)
router.get("/", authMiddleware, roleMiddleware(["Admin", "Store Manager", "Doctor", "Staff"]), getAllMaterials);

// Get Single Material by ID (Admin, Store Manager, Doctor, Staff)
router.get("/:id", authMiddleware, roleMiddleware(["Admin", "Store Manager", "Doctor", "Staff"]), getMaterialById);

export default router;

