const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const MONGODB_URI = process.env.MONGODB_URI;

const UserSchema = new mongoose.Schema(
  {
    name: { type: String },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String },
    password: { type: String },
    role: { type: String, enum: ["admin", "staff", "owner"], default: "staff" },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB.");
  const hashed = await bcrypt.hash("admin123", 12);
  const result = await User.updateOne(
    { email: "admin@example.com" },
    { $set: { passwordHash: hashed } }
  );
  console.log("Update result:", result);
  await mongoose.disconnect();
}

main().catch(console.error);
