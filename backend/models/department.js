// models/department.js
import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true
  },
  description: String,
  location: String,
  head: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  contactEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  contactPhone: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const Department = mongoose.models.Department || mongoose.model("Department", departmentSchema);
export default Department;