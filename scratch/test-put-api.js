const axios = require("axios");

async function main() {
  try {
    // Get latest pending production from db directly
    const mongoose = require("mongoose");
    const path = require("path");
    require("dotenv").config({ path: path.join(__dirname, "../.env.local") });
    require("dotenv").config({ path: path.join(__dirname, "../.env") });

    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;

    const pendingProd = await db
      .collection("productions")
      .findOne({ status: "pending" });
    const worker = await db.collection("workers").findOne({});

    if (!pendingProd) {
      console.log("No pending production orders to test with.");
      await mongoose.disconnect();
      return;
    }
    if (!worker) {
      console.log("No workers found to test with.");
      await mongoose.disconnect();
      return;
    }

    console.log("Found pending production ID:", pendingProd._id);
    console.log("Found worker:", worker);

    // Call PUT API using localhost
    const payload = {
      status: "processing",
      remarks: "Test remarks",
      deliveryDate: new Date(),
      items: pendingProd.items.map((it) => ({
        productName: it.itemName,
        quantity: it.quantity,
        bom: it.bom || [],
      })),
      workerId: worker._id.toString(),
      workerName: worker.name,
      workerContact: worker.contactNumber,
    };

    console.log("Sending payload:", payload);
    const res = await axios.put(
      `http://localhost:3000/api/production/${pendingProd._id}`,
      payload,
      {
        headers: {
          // Mock next-auth session cookie if needed, but wait! The API requires authentication.
          // If it requires auth, we can just run the test by direct schema method or we can see if it fails auth.
        },
      },
    );
    console.log("API Response:", res.data);

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err.response?.data || err.message);
  }
}

main();
