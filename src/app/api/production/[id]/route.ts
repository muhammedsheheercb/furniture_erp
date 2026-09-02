import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Production from "@/models/Production";
import Delivery from "@/models/Delivery";
import Sale from "@/models/Sale";
import Item from "@/models/Item";
import Material from "@/models/Material";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import mongoose from "mongoose";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const dbSession = await mongoose.startSession();
  dbSession.startTransaction();

  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );

    await connectDB();
    const { id } = await params;
    const {
      status,
      remarks,
      deliveryDate,
      items,
      deliveryPartner,
      driverName,
      driverContact,
      workerId,
      workerName,
      workerContact,
    } = await req.json();

    const production = await Production.findById(id).session(dbSession);
    if (!production)
      return NextResponse.json(
        { success: false, error: "Production not found" },
        { status: 404 },
      );

    console.log("[PUT /api/production/[id]] Incoming payload:", {
      workerId,
      workerName,
      workerContact,
    });
    if (workerId) {
      production.workerId = new mongoose.Types.ObjectId(workerId);
    }
    if (workerName) production.workerName = workerName;
    if (workerContact) production.workerContact = workerContact;

    // Handle "processing" start (Material deduction & Configuration saving)
    if (status === "processing" && production.status === "pending" && items) {
      for (const config of items) {
        // 1. Decrease Material Stock
        for (const bomItem of config.bom) {
          if (!bomItem.materialId || !bomItem.batchNumber) continue;

          const material = await (Material as any)
            .findById(bomItem.materialId)
            .session(dbSession);
          if (!material)
            throw new Error(`Material not found: ${bomItem.materialName}`);

          const batch = material.batches.find(
            (b: any) => b.batchNumber === bomItem.batchNumber,
          );
          if (!batch)
            throw new Error(
              `Batch ${bomItem.batchNumber} not found for material ${bomItem.materialName}`,
            );

          const totalNeeded = bomItem.quantity;
          if (batch.quantity < totalNeeded) {
            throw new Error(
              `Insufficient stock for material ${bomItem.materialName} in batch ${bomItem.batchNumber}`,
            );
          }

          batch.quantity -= totalNeeded;
          material.currentStock -= totalNeeded;
          batch.reservedQuantity = Math.max(0, (batch.reservedQuantity || 0) - totalNeeded);
          material.reservedStock = Math.max(0, (material.reservedStock || 0) - totalNeeded);
          await material.save({ session: dbSession });
        }
      }

      // Update production items with the new configuration
      production.items = items.map((it: any) => ({
        ...it,
        itemName: it.productName,
        status: "processing",
      }));
    }

    // Handle "finished" (Product registration)
    if (status === "finished" && production.status !== "finished") {
      for (const config of production.items) {
        // Register/Update Product (Item)
        let product = await Item.findOne({
          name: config.itemName,
          color: config.color,
          primaryMaterial: config.material,
          isManufactured: true,
        }).session(dbSession);

        if (product) {
          // Update existing product stock
          product.quantity = (product.quantity || 0) + config.quantity;
          if (config.pricing) {
            product.pricing = config.pricing;
            product.purchaseAmount = config.pricing.totalCost;
            product.salesAmount = config.pricing.sellingPrice;
          }
          product.dimensions = config.dimensions;
          product.bom = config.bom;
          product.variants = config.variants;
          await product.save({ session: dbSession });
        } else {
          // Create new product entry
          const sku = `PROD-${Math.floor(1000 + Math.random() * 9000)}`;
          await Item.create(
            [
              {
                itemNumber: sku,
                name: config.itemName,
                category: "Furniture",
                primaryMaterial: config.material || "—",
                color: config.color,
                quantity: config.quantity,
                isManufactured: true,
                unit: "Piece",
                status: "active",
                purchaseAmount: config.pricing?.totalCost || 0,
                salesAmount: config.pricing?.sellingPrice || 0,
                mrp: config.pricing?.discountPrice || 0,
                pricing: config.pricing,
                bom: config.bom,
                dimensions: config.dimensions,
                variants: config.variants,
              },
            ],
            { session: dbSession },
          );
        }
      }
    }

    production.status = status;
    if (remarks) production.remarks = remarks;
    if (deliveryDate) production.deliveryDate = new Date(deliveryDate);

    // Update linked sale status
    if (status === "processing") {
      await Sale.findByIdAndUpdate(production.saleId, {
        status: "processing",
      }).session(dbSession);
    } else if (status === "finished") {
      await Sale.findByIdAndUpdate(production.saleId, {
        status: "delivered",
      }).session(dbSession);
    }

    // If status is finished, create delivery entry
    if (status === "finished") {
      const existingDelivery = await Delivery.findOne({
        saleId: production.saleId,
      }).session(dbSession);
      if (!existingDelivery) {
        await Delivery.create(
          [
            {
              saleId: production.saleId,
              saleNumber: production.saleNumber,
              customerId: production.customerId,
              customerName: production.customerName,
              items: production.items.map((it: any) => ({
                itemName: it.itemName,
                quantity: it.quantity,
                status: "pending",
              })),
              status: "pending",
              deliveryPartner,
              driverName,
              driverContact,
            },
          ],
          { session: dbSession },
        );
      } else {
        existingDelivery.driverName = driverName;
        existingDelivery.driverContact = driverContact;
        if (deliveryPartner) {
          existingDelivery.deliveryPartner = deliveryPartner;
        }
        await existingDelivery.save({ session: dbSession });
      }
    }

    await production.save({ session: dbSession });
    await dbSession.commitTransaction();

    return NextResponse.json({ success: true, data: production });
  } catch (err: any) {
    await dbSession.abortTransaction();
    console.error("[PUT /api/production/:id]", err);
    return NextResponse.json(
      { success: false, error: err.message || "Server error" },
      { status: 500 },
    );
  } finally {
    dbSession.endSession();
  }
}
