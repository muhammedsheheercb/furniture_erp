import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Purchase from "@/models/Purchase";
import User from "@/models/User";
import Item from "@/models/Item";
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

    // Reverse old inventory impact
    for (const item of oldPurchase.items) {
      await Item.findByIdAndUpdate(item.itemId, { $inc: { quantity: -item.quantity } });
    }

    // Update record
    body.updatedBy = session.user.id;
    const purchase = await Purchase.findByIdAndUpdate(id, body, { new: true, runValidators: true });

    // Apply new inventory impact and update item details
    if (purchase) {
        for (const item of purchase.items) {
          await Item.findByIdAndUpdate(item.itemId, { 
            $inc: { quantity: item.quantity },
            $set: { 
              purchaseAmount: item.price, 
              salesAmount: item.sellingPrice,
              manufacturingDate: item.manufacturingDate,
              expiryDate: item.expiryDate 
            }
          });
        }
    }

    return NextResponse.json({ success: true, data: purchase });
  } catch (err: unknown) {
    console.error("[PUT /api/purchases/:id]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
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

    // Reverse inventory impact before delete
    for (const item of purchase.items) {
      await Item.findByIdAndUpdate(item.itemId, { $inc: { quantity: -item.quantity } });
    }

    // Reverse supplier balance impact if it was a credit purchase
    if (purchase.paymentType === "credit" && purchase.supplierId) {
        await Supplier.findByIdAndUpdate(purchase.supplierId, {
            $inc: { creditBalance: -purchase.total, openingBalance: -purchase.total },
            $push: {
                balanceHistory: {
                    date: new Date(),
                    amount: purchase.total,
                    type: "payment",
                    note: `CANCELLED Credit Purchase #${purchase.purchaseNumber}`
                }
            }
        });
    }

    await Purchase.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Purchase deleted" });
  } catch (err) {
    console.error("[DELETE /api/purchases/:id]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}