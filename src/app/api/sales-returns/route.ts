import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import SaleReturn from "@/models/SaleReturn";
import Sale from "@/models/Sale";
import Item from "@/models/Item";
import Customer from "@/models/Customer";
import User from "@/models/User";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(req.url);
    const saleId = searchParams.get("saleId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const query: any = {};
    if (saleId) {
      query.saleId = saleId;
    }
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const ed = new Date(endDate);
        ed.setHours(23, 59, 59, 999);
        query.date.$lte = ed;
      }
    }

    if (saleId) {
      const returns = await SaleReturn.find(query)
        .populate("createdBy", "name")
        .populate("updatedBy", "name")
        .sort({ createdAt: -1 });
      return NextResponse.json({ data: returns });
    }

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const [returns, total] = await Promise.all([
      SaleReturn.find(query)
        .populate("createdBy", "name")
        .populate("updatedBy", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      SaleReturn.countDocuments(query),
    ]);

    return NextResponse.json({
      data: returns,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch returns" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const dbSession = await mongoose.startSession();
  dbSession.startTransaction();

  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const body = await req.json();

    // 1 — Create the return record
    const enrichedItems = [];
    for (const it of body.items) {
      const dbItem = await Item.findById(it.itemId).session(dbSession);
      enrichedItems.push({
        ...it,
        itemNumber: it.itemNumber || dbItem?.itemNumber || "—",
      });
    }

    const newReturn = new SaleReturn({
      ...body,
      items: enrichedItems,
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
          const batch = item.batches.find(
            (b: any) => b.batchNumber === itemData.batch,
          );
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
            createdAt: new Date(),
          } as any);
        }

        await item.save({ session: dbSession });
      }
    }

    // 3 — Update customer balance (Sales Return decreases customer's credit balance only if the sale had unpaid balance)
    const sale = await Sale.findById(body.saleId).session(dbSession);
    const isCreditSale =
      sale &&
      (sale.paymentType === "credit" ||
        sale.total - (sale.advancePaid || 0) > 0);

    if (isCreditSale) {
      const refundAmount = Number(body.totalAmount || body.total || 0);
      await Customer.findByIdAndUpdate(
        body.customerId,
        {
          $inc: {
            creditBalance: -refundAmount,
          },
          $push: {
            balanceHistory: {
              date: new Date(),
              amount: refundAmount,
              type: "payment", // Returns are like payments (reduce debt)
              note: `Sales Return #${newReturn.returnNumber} (Original Sale: ${body.saleNumber})`,
            },
          },
        },
        { session: dbSession },
      );
    }

    await dbSession.commitTransaction();
    return NextResponse.json(newReturn, { status: 201 });
  } catch (error: any) {
    await dbSession.abortTransaction();
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    dbSession.endSession();
  }
}
