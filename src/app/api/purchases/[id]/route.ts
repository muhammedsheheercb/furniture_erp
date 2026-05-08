import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Purchase from "@/models/Purchase";
import Item from "@/models/Item";
import Material from "@/models/Material";
import Supplier from "@/models/Supplier";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

// GET /api/purchases/:id
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const purchase = await Purchase.findById(id)
      .populate("createdBy", "name")
      .populate("updatedBy", "name")
      .lean();
    if (!purchase) return NextResponse.json({ success: false, error: "Purchase not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: purchase });
  } catch (err) {
    console.error("[GET /api/purchases/:id]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

// PUT /api/purchases/:id
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const oldPurchase = await Purchase.findById(id);
    if (!oldPurchase) return NextResponse.json({ success: false, error: "Purchase not found" }, { status: 404 });

    // Reverse old stock impact
    for (const item of oldPurchase.items) {
      if (item.itemType === "material" && item.materialId) {
        await Material.findByIdAndUpdate(item.materialId, { $inc: { currentStock: -item.quantity } });
      } else if (item.itemId) {
        await Item.findByIdAndUpdate(item.itemId, { $inc: { quantity: -item.quantity } });
      }
    }

    body.updatedBy = session.user.id;
    const purchase = await Purchase.findByIdAndUpdate(id, body, { new: true, runValidators: true });

    // Apply new stock impact
    if (purchase) {
      for (const item of purchase.items) {
        if (item.itemType === "material" && item.materialId) {
          await Material.findByIdAndUpdate(item.materialId, {
            $inc: { currentStock: item.quantity },
            $set: { lastPurchasePrice: item.price },
          });
        } else if (item.itemId) {
          await Item.findByIdAndUpdate(item.itemId, {
            $inc: { quantity: item.quantity },
            $set: {
              purchaseAmount:   item.price,
              salesAmount:      item.sellingPrice || item.price,
              manufacturingDate: item.manufacturingDate,
              expiryDate:       item.expiryDate,
            },
          });
        }
      }
    }

    return NextResponse.json({ success: true, data: purchase });
  } catch (err: unknown) {
    console.error("[PUT /api/purchases/:id]", err);
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// DELETE /api/purchases/:id
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;

    const purchase = await Purchase.findById(id);
    if (!purchase) return NextResponse.json({ success: false, error: "Purchase not found" }, { status: 404 });

    // Reverse stock impact
    for (const item of purchase.items) {
      if (item.itemType === "material" && item.materialId) {
        await Material.findByIdAndUpdate(item.materialId, { $inc: { currentStock: -item.quantity } });
      } else if (item.itemId) {
        await Item.findByIdAndUpdate(item.itemId, { $inc: { quantity: -item.quantity } });
      }
    }

    // Reverse supplier credit balance
    if (purchase.paymentType === "credit" && purchase.supplierId) {
      await Supplier.findByIdAndUpdate(purchase.supplierId, {
        $inc: { creditBalance: -purchase.total },
        $push: {
          balanceHistory: {
            date:   new Date(),
            amount: purchase.total,
            type:   "payment",
            note:   `CANCELLED Purchase #${purchase.purchaseNumber}`,
          },
        },
      });
    }

    await Purchase.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Purchase deleted" });
  } catch (err) {
    console.error("[DELETE /api/purchases/:id]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
