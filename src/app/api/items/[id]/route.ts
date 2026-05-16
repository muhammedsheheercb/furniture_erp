import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Item from "@/models/Item";
import Material from "@/models/Material";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

type Params = { params: Promise<{ id: string }> };

// GET /api/items/:id
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const item = await Item.findById(id)
      .populate("createdBy", "name")
      .populate("updatedBy", "name")
      .lean();
    if (!item) return NextResponse.json({ success: false, error: "Item not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: item });
  } catch (err) {
    console.error("[GET /api/items/:id]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

// PUT /api/items/:id
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const body = await req.json();
    if (body.salesAmount !== undefined) body.salesAmount = Number(body.salesAmount);
    if (body.purchaseAmount !== undefined) body.purchaseAmount = Number(body.purchaseAmount);
    if (body.mrp !== undefined) body.mrp = Number(body.mrp);
    if (body.quantity !== undefined) body.quantity = Number(body.quantity);
    if (body.reorderLevel !== undefined) body.reorderLevel = Number(body.reorderLevel);
    if (body.taxRate !== undefined) body.taxRate = Number(body.taxRate);
    if (body.leadTime !== undefined) body.leadTime = Number(body.leadTime);
    body.updatedBy = session.user.id;

    let item;
    if (body.isOpeningStock) {
      item = await Item.findByIdAndUpdate(id, {
        $inc: { quantity: body.quantity },
        $set: { updatedBy: session.user.id },
        $push: {
          batches: {
            purchaseNumber: "OPENING",
            batchNumber: body.batchNumber || "OPN-INT",
            purchasePrice: body.purchaseAmount || 0,
            salePrice: body.salesAmount || 0,
            quantity: body.quantity || 0,
            manufacturingDate: body.manufacturingDate,
            expiryDate: body.expiryDate,
            createdAt: body.batchDate ? new Date(body.batchDate) : new Date()
          }
        }
      }, { new: true }).lean();
    } else {
      // Reverse old BOM deductions, then apply new ones
      const existing = await Item.findById(id).lean() as any;
      const oldBom: any[] = (existing?.bom || []).filter(
        (r: any) => r.materialId && r.batchNumber && Number(r.quantity) > 0
      );
      const newBom: any[] = (body.bom || []).filter(
        (r: any) => r.materialId && r.batchNumber && Number(r.quantity) > 0
      );

      // Restore old quantities back to materials
      if (oldBom.length > 0) {
        await Promise.all(
          oldBom.map((r: any) =>
            Material.updateOne(
              { _id: r.materialId, "batches.batchNumber": r.batchNumber },
              {
                $inc: {
                  currentStock: Number(r.quantity),
                  "batches.$.quantity": Number(r.quantity),
                },
              }
            )
          )
        );
      }

      // Deduct new BOM quantities
      if (newBom.length > 0) {
        await Promise.all(
          newBom.map((r: any) =>
            Material.updateOne(
              { _id: r.materialId, "batches.batchNumber": r.batchNumber },
              {
                $inc: {
                  currentStock: -Number(r.quantity),
                  "batches.$.quantity": -Number(r.quantity),
                },
              }
            )
          )
        );
      }

      item = await Item.findByIdAndUpdate(id, body, { new: true, runValidators: true }).lean();
    }

    if (!item) return NextResponse.json({ success: false, error: "Item not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: item });
  } catch (err: unknown) {
    console.error("[PUT /api/items/:id]", err);
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// DELETE /api/items/:id
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const item = await Item.findByIdAndDelete(id);
    if (!item) return NextResponse.json({ success: false, error: "Item not found" }, { status: 404 });

    return NextResponse.json({ success: true, message: "Item deleted" });
  } catch (err) {
    console.error("[DELETE /api/items/:id]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}