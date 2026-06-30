const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const MONGODB_URI = process.env.MONGODB_URI;

// Require the compiled model file (this will load it and trigger schema creation)
const Production = require("../src/models/Production").default;
const Worker = require("../src/models/Worker").default;

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB.");

  // Get a worker
  let worker = await Worker.findOne({});
  if (!worker) {
    worker = await Worker.create({ name: "Test Worker", contactNumber: "+968 1234 5678" });
    console.log("Created test worker:", worker);
  } else {
    console.log("Using existing worker:", worker);
  }

  // Get the latest production order
  const prod = await Production.findOne({ status: "processing" });
  if (!prod) {
    console.log("No processing production orders found to test.");
    await mongoose.disconnect();
    return;
  }

  console.log("Before assignment:", {
    _id: prod._id,
    workerId: prod.workerId,
    workerName: prod.workerName,
    workerContact: prod.workerContact
  });

  // Assign
  prod.workerId = worker._id;
  prod.workerName = worker.name;
  prod.workerContact = worker.contactNumber;

  await prod.save();
  console.log("Saved.");

  // Refetch from DB directly (bypassing mongoose cache via lean or direct collection fetch)
  const db = mongoose.connection.db;
  const rawDoc = await db.collection("productions").findOne({ _id: prod._id });
  console.log("After assignment (Direct DB query):", {
    _id: rawDoc._id,
    workerId: rawDoc.workerId,
    workerName: rawDoc.workerName,
    workerContact: rawDoc.workerContact
  });

  await mongoose.disconnect();
}

main().catch(console.error);
