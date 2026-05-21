const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const MONGODB_URI = process.env.MONGODB_URI;

const DeliverySchema = new mongoose.Schema({}, { strict: false });

const Delivery = mongoose.models.Delivery || mongoose.model("Delivery", DeliverySchema);

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB.");
  const deliveries = await Delivery.find({});
  console.log("All Deliveries in DB:", JSON.stringify(deliveries, null, 2));
  await mongoose.disconnect();
}

main().catch(console.error);
