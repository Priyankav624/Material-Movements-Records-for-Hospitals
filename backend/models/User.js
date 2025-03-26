import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: { type: String, enum: ["Admin", "Doctor", "Store Manager", "Staff"] },
});

const User = mongoose.model("User", userSchema);
export default User;