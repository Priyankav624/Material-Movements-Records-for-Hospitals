import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import dotenv from "dotenv";
import ActivityLog from '../models/ActivityLog.js';

dotenv.config();

// User Sign-in Logic
export const signIn = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: "User not found" });

    if (user.role !== role) return res.status(403).json({ message: "Unauthorized Role" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid Password" });

    const token = jwt.sign({ id: user._id, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: "1h" });

    // Log the login activity
    await ActivityLog.create({
      userId: user._id,
      action: 'LOGIN',
      ipAddress: req.ip
    });

    res.json({ 
      token, 
      name: user.name, 
      role: user.role,
      id: user._id,
      email: user.email
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
    console.log(error);
  }
};

// Admin Creates a New User
export const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!["Doctor", "Store Manager", "Staff"].includes(role)) {
      return res.status(400).json({ message: "Invalid Role" });
    }

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    user = new User({ name, email, password: hashedPassword, role });

    await user.save();

    // Log the user creation activity
    await ActivityLog.create({
      userId: req.user.id, // Admin who created the user
      action: 'CREATE_USER',
      entityType: 'User',
      entityId: user._id,
      details: { createdUser: user.email, role: user.role },
      ipAddress: req.ip
    });

    res.status(201).json({ message: "User Created Successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

export const logout = async (req, res) => {
  try {
    // Find the most recent login activity
    const lastLogin = await ActivityLog.findOne({
      userId: req.user.id,
      action: 'LOGIN'
    }).sort({ timestamp: -1 });

    // Create logout activity
    await ActivityLog.create({
      userId: req.user.id,
      action: 'LOGOUT',
      ipAddress: req.ip,
      logoutTime: new Date(),
      sessionDuration: lastLogin ? 
        (new Date() - lastLogin.timestamp) / 1000 : null
    });
    
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Logout failed' });
  }
};
