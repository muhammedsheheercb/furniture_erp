import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Sale from "@/models/Sale";
import User from "@/models/User";
import Item from "@/models/Item";
import Customer from "@/models/Customer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

// GET /api/sales/:id
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const sale = await Sale.findById(id)
      .populate("createdBy", "name")
      .populate("updatedBy", "name")
      .lean();
    if (!sale) return NextResponse.json({ success: false, error: "Sale not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: sale });
  } catch (err) {
    console.error("[GET /api/sales/:id]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

// PUT /api/sales/:id
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const oldSale = await Sale.findById(id);
    if (!oldSale) return NextResponse.json({ success: false, error: "Sale not found" }, { status: 404 });

    // Reverse old inventory impact (increase stock because sale is being "undone")
    for (const item of oldSale.items) {
      await Item.findByIdAndUpdate(item.itemId, { $inc: { quantity: item.quantity } });
    }

    // Update record
    body.updatedBy = session.user.id;
    const sale = await Sale.findByIdAndUpdate(id, body, { new: true, runValidators: true });

    // Apply new inventory impact (decrease stock for the updated sale)
    if (sale) {
        for (const item of sale.items) {
          await Item.findByIdAndUpdate(item.itemId, { $inc: { quantity: -item.quantity } });
        }
    }

    return NextResponse.json({ success: true, data: sale });
  } catch (err: unknown) {
    console.error("[PUT /api/sales/:id]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

// DELETE /api/sales/:id
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;
    
    const sale = await Sale.findById(id);
    if (!sale) return NextResponse.json({ success: false, error: "Sale not found" }, { status: 404 });

    // Reverse inventory impact before delete
    for (const item of sale.items) {
      await Item.findByIdAndUpdate(item.itemId, { $inc: { quantity: item.quantity } });
    }

    // Reverse customer balance impact if it was a credit sale
    if (sale.paymentType === "credit" && sale.customerId) {
        await Customer.findByIdAndUpdate(sale.customerId, {
            $inc: { creditBalance: -sale.total, openingBalance: -sale.total },
            $push: {
                balanceHistory: {
                    date: new Date(),
                    amount: sale.total,
                    type: "payment",
                    note: `CANCELLED Credit Sale #${sale.saleNumber}`
                }
            }
        });
    }

    await Sale.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Sale deleted" });
  } catch (err) {
    console.error("[DELETE /api/sales/:id]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}