import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import SaleReturn from "@/models/SaleReturn";
import Item from "@/models/Item";
import Customer from "@/models/Customer";
import User from "@/models/User";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(req.url);
    const page  = parseInt(searchParams.get("page")  || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip  = (page - 1) * limit;

    const [returns, total] = await Promise.all([
      SaleReturn.find()
        .populate("createdBy", "name")
        .populate("updatedBy", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      SaleReturn.countDocuments()
    ]);

    return NextResponse.json({
      data: returns,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch returns" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const dbSession = await mongoose.startSession();
  dbSession.startTransaction();

  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const body = await req.json();

    // 1 — Create the return record
    const newReturn = new SaleReturn({
      ...body,
      createdBy: session.user.id,
      updatedBy: session.user.id,
    });
    await newReturn.save({ session: dbSession });

    // 2 — Reverse inventory
    for (const itemData of body.items) {
      const item = await Item.findById(itemData.itemId).session(dbSession);
      if (item) {
        item.quantity = (item.quantity || 0) + itemData.quantity;
        
        let batchUpdated = false;
        if (itemData.batch && item.batches && item.batches.length > 0) {
          const batch = item.batches.find((b: any) => b.batchNumber === itemData.batch);
          if (batch) {
            batch.quantity += itemData.quantity;
            batchUpdated = true;
          }
        }
        
        if (!batchUpdated) {
          if (!item.batches) item.batches = [];
          item.batches.push({
            batchNumber: itemData.batch || `RET-${newReturn.returnNumber}`,
            purchasePrice: itemData.price,
            salePrice: itemData.price,
            quantity: itemData.quantity,
            createdAt: new Date()
          } as any);
        }
        
        await item.save({ session: dbSession });
      }
    }

    // 3 — Update customer balance (Sales Return decreases customer's credit balance)
    const refundAmount = Number(body.totalAmount || body.total || 0);
    await Customer.findByIdAndUpdate(
      body.customerId,
      { 
        $inc: { 
          creditBalance: -refundAmount
        },
        $push: { 
          balanceHistory: {
            date: new Date(),
            amount: refundAmount,
            type: "payment", // Returns are like payments (reduce debt)
            note: `Sales Return #${newReturn.returnNumber}`
          }
        }
      },
      { session: dbSession }
    );

    await dbSession.commitTransaction();
    return NextResponse.json(newReturn, { status: 201 });
  } catch (error: any) {
    await dbSession.abortTransaction();
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    dbSession.endSession();
  }
}
