import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import SaleReturnRaw from "@/models/SaleReturn";
const SaleReturn = SaleReturnRaw as any;
import ItemRaw from "@/models/Item";
const Item = ItemRaw as any;
import CustomerRaw from "@/models/Customer";
const Customer = CustomerRaw as any;
import User from "@/models/User";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  const dbSession = await mongoose.startSession();
  dbSession.startTransaction();

  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;
    
    // 1 — Get the existing return record
    const saleReturn = await SaleReturn.findById(id).session(dbSession);
    if (!saleReturn) {
      return NextResponse.json({ error: "Return record not found" }, { status: 404 });
    }

    // 2 — Reverse inventory (Decrease item quantity - Revert the return increase)
    for (const item of saleReturn.items) {
      await Item.findByIdAndUpdate(
        item.itemId,
        { $inc: { quantity: -item.quantity } },
        { session: dbSession }
      );
    }

    // 3 — Revert customer balance (Add back the refund amount to their debt)
    const refundAmount = Number(saleReturn.totalAmount || 0);
    await Customer.findByIdAndUpdate(
      saleReturn.customerId,
      { 
        $inc: { creditBalance: refundAmount },
        $push: { 
          balanceHistory: {
            date: new Date(),
            amount: refundAmount,
            type: "adjustment", // Deleting a return is an adjustment (debt restored)
            paymentMethod: "credit",
            note: `Reversed Sale Return #${saleReturn.returnNumber}`
          }
        }
      },
      { session: dbSession }
    );

    // 4 — Delete the record
    await SaleReturn.findByIdAndDelete(id, { session: dbSession });

    await dbSession.commitTransaction();
    return NextResponse.json({ message: "Return record deleted successfully" });
  } catch (error: any) {
    await dbSession.abortTransaction();
    console.error("[DELETE /api/sales-returns/[id]]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    dbSession.endSession();
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  const dbSession = await mongoose.startSession();
  dbSession.startTransaction();

  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const body = await req.json();

    // 1 — Revert OLD return impact
    const oldReturn = await SaleReturn.findById(id).session(dbSession);
    if (!oldReturn) return NextResponse.json({ error: "Return record not found" }, { status: 404 });

    // Reverse old inventory impact
    for (const item of oldReturn.items) {
      await Item.findByIdAndUpdate(item.itemId, { $inc: { quantity: -item.quantity } }, { session: dbSession });
    }
    // Reverse old customer balance impact
    await Customer.findByIdAndUpdate(oldReturn.customerId, { $inc: { creditBalance: oldReturn.totalAmount } }, { session: dbSession });

    // 2 — Apply NEW return impact
    // Update inventory for new items
    for (const item of body.items) {
      await Item.findByIdAndUpdate(item.itemId, { $inc: { quantity: item.quantity } }, { session: dbSession });
    }
    // Update customer balance for new total
    const newRefundAmount = Number(body.totalAmount || 0);
    await Customer.findByIdAndUpdate(body.customerId, { 
      $inc: { creditBalance: -newRefundAmount },
      $push: { 
        balanceHistory: {
          date: new Date(),
          amount: newRefundAmount,
          type: "payment",
          note: `Updated Sales Return #${oldReturn.returnNumber}`
        }
      }
    }, { session: dbSession });

    // 3 — Update the record
    const updated = await SaleReturn.findByIdAndUpdate(id, {
      ...body,
      updatedBy: session.user.id
    }, { session: dbSession, new: true });

    await dbSession.commitTransaction();
    return NextResponse.json(updated);
  } catch (error: any) {
    await dbSession.abortTransaction();
    console.error("[PUT /api/sales-returns/[id]]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    dbSession.endSession();
  }
}
