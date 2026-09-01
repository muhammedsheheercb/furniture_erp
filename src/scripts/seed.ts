import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import {
  User,
  Product,
  Customer,
  Supplier,
  RawMaterial,
} from "../lib/models/base";
import { BOM } from "../lib/models/transactional";

dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Please define MONGODB_URI");
  process.exit(1);
}

async function seed() {
  await mongoose.connect(MONGODB_URI!);
  console.log("Connected to MongoDB");

  // Clear existing data
  await (User as any).deleteMany({});
  await (Product as any).deleteMany({});
  await (Customer as any).deleteMany({});
  await (Supplier as any).deleteMany({});
  await (RawMaterial as any).deleteMany({});
  await (BOM as any).deleteMany({});

  // 1. Create Owner
  const passwordHash = await bcrypt.hash("admin123", 10);
  const owner = await (User as any).create({
    name: "Furniture Owner",
    email: "owner@example.com",
    passwordHash,
    role: "owner",
  });
  console.log("Owner created");

  // 2. Create Suppliers
  const s1 = await (Supplier as any).create({
    name: "Timber Mart",
    contactPerson: "John",
    phone: "9876543210",
  });
  const s2 = await (Supplier as any).create({
    name: "Global Hardware",
    contactPerson: "Sara",
    phone: "9123456789",
  });

  // 3. Create Raw Materials
  const m1 = await (RawMaterial as any).create({
    name: "Teak Wood",
    category: "wood",
    unit: "sqft",
    currentStock: 200,
    preferredSupplierId: s1._id,
  });
  const m2 = await (RawMaterial as any).create({
    name: "Velvet Fabric",
    category: "fabric",
    unit: "meter",
    currentStock: 50,
    preferredSupplierId: s2._id,
  });
  const m3 = await (RawMaterial as any).create({
    name: "Stainless Steel Hinge",
    category: "hardware",
    unit: "piece",
    currentStock: 100,
  });

  // 4. Create Products
  const p1 = await (Product as any).create({
    sku: "SOF-001",
    name: "Luxury Sofa",
    category: "sofa",
    costPrice: 25000,
    sellingPrice: 45000,
    isManufactured: true,
    currentStock: 5,
  });
  const p2 = await (Product as any).create({
    sku: "TAB-001",
    name: "Oak Dining Table",
    category: "table",
    costPrice: 15000,
    sellingPrice: 30000,
    isManufactured: true,
    currentStock: 2,
  });

  // 5. Create BOMs
  await (BOM as any).create({
    productId: p1._id,
    materials: [
      { materialId: m1._id, quantity: 10, unit: "sqft" },
      { materialId: m2._id, quantity: 5, unit: "meter" },
    ],
    laborCost: 5000,
    totalCost: 25000,
  });

  // 6. Create Customers
  await (Customer as any).create({
    name: "Rajesh Kumar",
    phone: "9000011111",
    customerType: "retail",
  });
  await (Customer as any).create({
    name: "Creative Spaces",
    phone: "9000022222",
    customerType: "designer",
  });

  console.log("Seeding completed");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
