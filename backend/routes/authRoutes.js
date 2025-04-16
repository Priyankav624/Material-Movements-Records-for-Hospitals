import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js"; 
import { roleMiddleware } from "../middlewares/roleMiddleware.js"; 
import { createUser, signIn, getUsers } from "../controllers/authController.js";



const router = express.Router();

router.post("/signin", signIn);
router.post("/create-user", authMiddleware, roleMiddleware(["Admin"]), createUser);


router.get("/", authMiddleware, roleMiddleware(["Admin", "Store Manager"]), getUsers);


export default router;
