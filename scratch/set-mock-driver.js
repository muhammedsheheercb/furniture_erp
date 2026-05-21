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
  
  // Find a pending delivery
  const pendingDelivery = await Delivery.findOne({ status: "pending" });
  if (!pendingDelivery) {
    console.log("No pending delivery found!");
    await mongoose.disconnect();
    return;
  }
  
  console.log("Found pending delivery:", pendingDelivery.saleNumber);
  
  pendingDelivery.driverName = "Salim Al-Balushi";
  pendingDelivery.driverContact = "+968 9988 7766";
  await pendingDelivery.save();
  console.log("Updated pending delivery with driver details.");
  
  await mongoose.disconnect();
}

main().catch(console.error);
