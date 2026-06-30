const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const MONGODB_URI = process.env.MONGODB_URI;

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected.");
  const db = mongoose.connection.db;
  const productions = await db.collection("productions").find({}).sort({ updatedAt: -1 }).limit(3).toArray();
  console.log("Latest Productions:", JSON.stringify(productions, null, 2));
  await mongoose.disconnect();
}

main().catch(console.error);
