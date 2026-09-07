import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Material from "@/models/Material";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import mongoose from "mongoose";

type Params = { params: Promise<{ id: string }> };

// PUT /api/materials/:id
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );

    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const existingMaterial = await Material.findById(id);
    if (!existingMaterial) {
      return NextResponse.json(
        { success: false, error: "Material not found" },
        { status: 404 },
      );
    }

    if (body.currentStock !== undefined) {
      const stockDiff = body.currentStock - existingMaterial.currentStock;
      if (stockDiff !== 0) {
        // Find if there is an opening stock batch
        let openingBatchIndex = existingMaterial.batches?.findIndex(
          (b: any) => b.purchaseNumber === 'OPENING-STOCK'
        );
        
        if (openingBatchIndex !== -1 && existingMaterial.batches) {
          existingMaterial.batches[openingBatchIndex].quantity += stockDiff;
        } else if (stockDiff > 0) {
          if (!existingMaterial.batches) existingMaterial.batches = [];
          existingMaterial.batches.push({
            purchaseId: new mongoose.Types.ObjectId().toString(),
            purchaseNumber: 'OPENING-STOCK',
            batchNumber: `BATCH-001`,
            purchaseDate: new Date(),
            purchasePrice: body.lastPurchasePrice || existingMaterial.lastPurchasePrice || 0,
            quantity: body.currentStock,
            reservedQuantity: 0,
          });
        }
      }
    }

    Object.assign(existingMaterial, body);
    await existingMaterial.save();
    const material = existingMaterial;

    return NextResponse.json({ success: true, data: material });
  } catch (err: unknown) {
    console.error("[PUT /api/materials/:id]", err);
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// DELETE /api/materials/:id
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );

    await connectDB();
    const { id } = await params;

    const material = await Material.findByIdAndDelete(id);
    if (!material)
      return NextResponse.json(
        { success: false, error: "Material not found" },
        { status: 404 },
      );

    return NextResponse.json({ success: true, message: "Material deleted" });
  } catch (err) {
    console.error("[DELETE /api/materials/:id]", err);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 },
    );
  }
}
