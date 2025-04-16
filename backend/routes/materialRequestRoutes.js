// import express from "express";
// import { requestMaterial, getRequests, updateRequestStatus, getMyRequests } from "../controllers/materialRequestController.js";
// import { authMiddleware} from "../middlewares/authMiddleware.js";
// import { roleMiddleware } from "../middlewares/roleMiddleware.js";

// const router = express.Router();

// // Doctor/Staff can request material
// router.post("/request", authMiddleware, roleMiddleware(["Doctor", "Staff"]), requestMaterial);

// // Store Manager/Admin can view all requests
// router.get("/", authMiddleware, roleMiddleware(["Store Manager", "Admin"]), getRequests);

// // Store Manager/Admin can approve/reject a request
// router.put("/:id", authMiddleware, roleMiddleware(["Store Manager", "Admin"]), updateRequestStatus);

// router.get("/my-requests",  authMiddleware, roleMiddleware(["Doctor", "Staff"]), getMyRequests);

// export default router;

import express from "express";
import { 
  requestMaterial, 
  getRequests, 
  updateRequestStatus, 
  getMyRequests,
  trackIssuedItems
} from "../controllers/materialRequestController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = express.Router();

// Doctor/Staff can request material
router.post("/request", authMiddleware, roleMiddleware(["Doctor", "Staff"]), requestMaterial);

// Store Manager/Admin can view all requests
router.get("/", authMiddleware, roleMiddleware(["Store Manager", "Admin"]), getRequests);

// Store Manager/Admin can approve/reject a request
router.put("/:id", authMiddleware, roleMiddleware(["Store Manager", "Admin"]), updateRequestStatus);

// Users can view their own requests
router.get("/my-requests", authMiddleware, roleMiddleware(["Doctor", "Staff"]), getMyRequests);

// Track issued items
router.get("/track-issued", authMiddleware, roleMiddleware(["Store Manager", "Admin"]), trackIssuedItems);

export default router;