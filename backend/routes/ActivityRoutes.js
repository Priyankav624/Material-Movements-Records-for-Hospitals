import express from 'express';
import { getActivityLogs, getUserActivityLogs } from '../controllers/activityController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { roleMiddleware } from '../middlewares/roleMiddleware.js';

const router = express.Router();

router.get('/',  authMiddleware, roleMiddleware(["Admin"]), getActivityLogs);
router.get('/user/:userId',  authMiddleware, roleMiddleware(["Admin"]), getUserActivityLogs);

export default router;