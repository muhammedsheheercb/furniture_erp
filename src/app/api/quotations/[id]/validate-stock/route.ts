import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Quotation from "@/models/Quotation";
import Material from "@/models/Material";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const resolvedParams = await params;
    const quotation = await Quotation.findById(resolvedParams.id);
    if (!quotation) {
      return NextResponse.json(
        { success: false, error: "Quotation not found" },
        { status: 404 },
      );
    }

    // Accumulate total required quantities per batch across all items
    const requiredQuantities: Record<
      string,
      { materialId: string; batchNumber: string; qty: number }
    > = {};

    for (const item of quotation.items) {
      if (item.bom && Array.isArray(item.bom)) {
        for (const bomItem of item.bom) {
          if (!bomItem.materialId || !bomItem.batchNumber) continue;
          const key = `${bomItem.materialId}_${bomItem.batchNumber}`;
          if (!requiredQuantities[key]) {
            requiredQuantities[key] = {
              materialId: bomItem.materialId.toString(),
              batchNumber: bomItem.batchNumber,
              qty: 0,
            };
          }
          requiredQuantities[key].qty += bomItem.quantity || 0;
        }
      }
    }

    // Validate against database
    for (const key in requiredQuantities) {
      const req = requiredQuantities[key];
      if (!req) continue;
      const { materialId, batchNumber, qty } = req;
      const material = await Material.findById(materialId);
      if (!material) continue;

      const batch = material.batches?.find(
        (b: any) => b.batchNumber === batchNumber,
      );
      if (batch) {
        const available = Math.max(
          0,
          (batch.quantity || 0) - (batch.reservedQuantity || 0),
        );
        if (available < qty) {
          const errorMsg = `Insufficient Material Stock – Available quantity: ${available}.`;
          quotation.validationError = errorMsg;
          await quotation.save();

          return NextResponse.json(
            {
              success: false,
              error: errorMsg,
            },
            { status: 400 },
          );
        }
      }
    }

    quotation.validationError = undefined;
    await quotation.save();

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
