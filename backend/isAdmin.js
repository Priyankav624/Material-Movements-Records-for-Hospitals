const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const insertAdmin = async () => {
  const hashedPassword = await bcrypt.hash("admin123", 10); 
  const admin = new User({
    name: "Admin",
    email: "admin@hospital.com",
    password: hashedPassword,
    role: "Admin",
  });

  await admin.save();
  console.log("Admin Created");
  mongoose.connection.close();
};

insertAdmin();
