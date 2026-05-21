const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const MONGODB_URI = process.env.MONGODB_URI;

const ProductionSchema = new mongoose.Schema({}, { strict: false });

const Production = mongoose.models.Production || mongoose.model("Production", ProductionSchema);

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB.");
  const productions = await Production.find({});
  console.log("All Productions in DB:", JSON.stringify(productions, null, 2));
  await mongoose.disconnect();
}

main().catch(console.error);
