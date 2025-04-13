import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js"; 
import { roleMiddleware } from "../middlewares/roleMiddleware.js"; 

import { createUser, signIn, logout } from "../controllers/authController.js";  


const router = express.Router();

router.post("/signin", signIn);
router.post("/create-user", authMiddleware, roleMiddleware(["Admin"]), createUser);
router.post('/logout', authMiddleware, logout);

export default router;
