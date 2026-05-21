import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import SalesReturn from "@/models/SalesReturn";
import Sale from "@/models/Sale";
import Item from "@/models/Item";
import Customer from "@/models/Customer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    
    const query: any = {};
    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: "i" } },
        { saleNumber: { $regex: search, $options: "i" } },
        { returnNumber: { $regex: search, $options: "i" } },
      ];
    }

    const returns = await SalesReturn.find(query).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: returns });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const dbSession = await mongoose.startSession();
  dbSession.startTransaction();
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const body = await req.json();
    
    const { saleId, items, reason } = body;
    if (!saleId || !items || items.length === 0) {
      return NextResponse.json({ success: false, error: "Sale ID and items are required" }, { status: 400 });
    }

    const sale = await Sale.findById(saleId).session(dbSession);
    if (!sale) return NextResponse.json({ success: false, error: "Sale not found" }, { status: 404 });

    // Generate return number
    const count = await SalesReturn.countDocuments().session(dbSession);
    const returnNumber = `RET-${String(count + 1).padStart(5, "0")}`;

    const totalReturnAmount = items.reduce((acc: number, it: any) => acc + (it.price * it.quantity), 0);

    // 1. Create Sales Return record
    const [salesReturn] = await SalesReturn.create([
      {
        returnNumber,
        saleId: sale._id,
        saleNumber: sale.saleNumber,
        customerId: sale.customerId,
        customerName: sale.customerName,
        items,
        totalAmount: totalReturnAmount,
        reason,
        createdBy: session.user.id
      }
    ], { session: dbSession });

    // 2. Increase stock for each item
    for (const retItem of items) {
      if (retItem.itemId) {
        const item = await Item.findById(retItem.itemId).session(dbSession);
        if (item) {
          item.quantity = (item.quantity || 0) + retItem.quantity;
          
          // Add back to batch if possible
          if (item.batches && item.batches.length > 0) {
            // Find the oldest batch or create a "Returns" batch
            item.batches[0].quantity += retItem.quantity;
          }
          
          await item.save({ session: dbSession });
        }
      }
    }

    // 3. Decrease customer outstanding balance
    const customer = await Customer.findById(sale.customerId).session(dbSession);
    if (customer) {
      customer.creditBalance = (customer.creditBalance || 0) - totalReturnAmount;
      if (!customer.balanceHistory) customer.balanceHistory = [];
      customer.balanceHistory.push({
        date: new Date(),
        amount: -totalReturnAmount,
        type: "adjustment",
        paymentMethod: "return",
        note: `Sales Return — ${returnNumber} (Ref Sale: ${sale.saleNumber})`,
      });
      await customer.save({ session: dbSession });
    }

    await dbSession.commitTransaction();
    return NextResponse.json({ success: true, data: salesReturn }, { status: 201 });
  } catch (err: any) {
    await dbSession.abortTransaction();
    console.error("[POST /api/sales/returns]", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  } finally {
    dbSession.endSession();
  }
}
