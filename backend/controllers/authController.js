import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import dotenv from "dotenv";

dotenv.config();

export const signIn = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: "User not found" });

    if (user.role !== role) return res.status(403).json({ message: "Unauthorized Role" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid Password" });

    const token = jwt.sign({ id: user._id, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: "1h" });
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
    res.status(201).json({ message: "User Created Successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
