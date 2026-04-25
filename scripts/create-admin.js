#!/usr/bin/env node
/**
 * Admin creation script for Diamond Home Furniture ERP
 * Usage: node scripts/create-admin.js
 *
 * Requires MONGODB_URI in .env or .env.local
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const readline = require("readline");

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌  MONGODB_URI is not set. Add it to .env or .env.local");
  process.exit(1);
}

const UserSchema = new mongoose.Schema(
  {
    name: { type: String },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "staff"], default: "staff" },
    permissions: { type: Map, of: Object, default: {} },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);

function prompt(rl, question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  console.log("\n╔══════════════════════════════════╗");
  console.log("║   Diamond Home — Create Admin    ║");
  console.log("╚══════════════════════════════════╝\n");

  const name     = await prompt(rl, "Admin name     : ");
  const email    = await prompt(rl, "Admin email    : ");
  const password = await prompt(rl, "Admin password : ");

  rl.close();

  if (!email || !password) {
    console.error("❌  Email and password are required.");
    process.exit(1);
  }
  if (password.length < 6) {
    console.error("❌  Password must be at least 6 characters.");
    process.exit(1);
  }

  console.log("\nConnecting to MongoDB…");
  await mongoose.connect(MONGODB_URI);
  console.log("✔  Connected.");

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    console.error(`❌  A user with email "${email}" already exists (role: ${existing.role}).`);
    await mongoose.disconnect();
    process.exit(1);
  }

  const hashed = await bcrypt.hash(password, 12);
  await User.create({
    name:     name.trim() || "Admin",
    email:    email.toLowerCase().trim(),
    password: hashed,
    role:     "admin",
    permissions: {},
  });

  console.log(`\n✅  Admin created successfully!`);
  console.log(`   Name  : ${name.trim() || "Admin"}`);
  console.log(`   Email : ${email.toLowerCase().trim()}`);
  console.log(`   Role  : admin\n`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("❌  Error:", err.message);
  process.exit(1);
});
