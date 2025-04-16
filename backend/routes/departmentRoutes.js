// routes/departmentRoutes.js
import express from "express";
import { 
  createDepartment,
  getDepartments,
  updateDepartment,
  deleteDepartment
} from "../controllers/departmentController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, roleMiddleware(["Admin"]), createDepartment);
router.get("/", authMiddleware, getDepartments);
router.put("/:id", authMiddleware, roleMiddleware(["Admin"]), updateDepartment);
router.delete("/:id", authMiddleware, roleMiddleware(["Admin"]), deleteDepartment);

export default router;