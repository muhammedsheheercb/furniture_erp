const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const MONGODB_URI = process.env.MONGODB_URI;

const DeliverySchema = new mongoose.Schema(
  {
    saleNumber: String,
    customerName: String,
    driverName: String,
    driverContact: String,
    status: String,
  },
  { strict: false }
);

const Delivery = mongoose.models.Delivery || mongoose.model("Delivery", DeliverySchema);

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB.");
  const deliveries = await Delivery.find({}, { saleNumber: 1, customerName: 1, driverName: 1, driverContact: 1, status: 1 });
  console.log("Deliveries in DB:", JSON.stringify(deliveries, null, 2));
  await mongoose.disconnect();
}

main().catch(console.error);
