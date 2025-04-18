import express from "express";
import connectDB from "./config/db.js";
import cors from "cors";
import dotenv from 'dotenv';
import authRoutes from "./routes/authRoutes.js"
import materialRoutes from "./routes/materialRoutes.js"
import materialRequestRoutes from "./routes/materialRequestRoutes.js";
import movementLog from "./routes/movementLogRoutes.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

connectDB();

app.use("/api/auth", authRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/material-requests", materialRequestRoutes);
app.use("/api/movement-logs", movementLog); 

import departmentRoutes from './routes/departmentRoutes.js';

// ... after other middleware
app.use('/api/departments', departmentRoutes);

app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(err.status || 500).json({ message: err.message || "Something went wrong!" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
