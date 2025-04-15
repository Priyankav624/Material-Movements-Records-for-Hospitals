import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js"; 
import { roleMiddleware } from "../middlewares/roleMiddleware.js"; 

import { createUser, signIn} from "../controllers/authController.js";  


const router = express.Router();

router.post("/signin", signIn);
router.post("/create-user", authMiddleware, roleMiddleware(["Admin"]), createUser);

export default router;
