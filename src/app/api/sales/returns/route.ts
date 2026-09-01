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
    if (!session)
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );

    await connectDB();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const saleId = searchParams.get("saleId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const query: any = {};
    if (saleId) {
      query.saleId = new mongoose.Types.ObjectId(saleId);
      const returns = await SalesReturn.find(query)
        .sort({ createdAt: -1 })
        .lean();
      return NextResponse.json({ success: true, data: returns });
    }

    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: "i" } },
        { saleNumber: { $regex: search, $options: "i" } },
        { returnNumber: { $regex: search, $options: "i" } },
      ];
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

    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    const [returns, total] = await Promise.all([
      SalesReturn.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SalesReturn.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: returns,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const dbSession = await mongoose.startSession();
  dbSession.startTransaction();
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );

    await connectDB();
    const body = await req.json();

    const { saleId, items, reason } = body;
    if (!saleId || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Sale ID and items are required" },
        { status: 400 },
      );
    }

    const sale = await Sale.findById(saleId).session(dbSession);
    if (!sale)
      return NextResponse.json(
        { success: false, error: "Sale not found" },
        { status: 404 },
      );

    // Validate quantities against existing returns
    const existingReturns = await SalesReturn.find({
      saleId: sale._id,
    }).session(dbSession);
    const returnedQtyMap: Record<string, number> = {};
    existingReturns.forEach((ret: any) => {
      ret.items.forEach((item: any) => {
        const key = item.itemId ? item.itemId.toString() : item.itemName;
        returnedQtyMap[key] = (returnedQtyMap[key] || 0) + item.quantity;
      });
    });

    for (const retItem of items) {
      const saleItem = sale.items.find((it: any) => {
        if (retItem.itemId && it.itemId) {
          return it.itemId.toString() === retItem.itemId.toString();
        }
        return it.itemName === retItem.itemName;
      });
      if (!saleItem) {
        return NextResponse.json(
          {
            success: false,
            error: `Item ${retItem.itemName} was not purchased in this sale`,
          },
          { status: 400 },
        );
      }
      const key = retItem.itemId ? retItem.itemId.toString() : retItem.itemName;
      const alreadyReturned = returnedQtyMap[key] || 0;
      const maxAllowed = saleItem.quantity - alreadyReturned;
      if (retItem.quantity > maxAllowed) {
        return NextResponse.json(
          {
            success: false,
            error: `Cannot return more than ${maxAllowed} units of ${retItem.itemName}. ${alreadyReturned} units already returned.`,
          },
          { status: 400 },
        );
      }
    }

    // Generate return number
    const count = await SalesReturn.countDocuments().session(dbSession);
    const returnNumber = `RET-${String(count + 1).padStart(5, "0")}`;

    const totalReturnAmount = items.reduce(
      (acc: number, it: any) => acc + it.price * it.quantity,
      0,
    );

    // 1. Create Sales Return record
    const [salesReturn] = await SalesReturn.create(
      [
        {
          returnNumber,
          saleId: sale._id,
          saleNumber: sale.saleNumber,
          customerId: sale.customerId,
          customerName: sale.customerName,
          items,
          totalAmount: totalReturnAmount,
          reason,
          createdBy: session.user.id,
        },
      ],
      { session: dbSession },
    );

    // 2. Increase stock for each item
    for (const retItem of items) {
      if (retItem.itemId) {
        const item = await Item.findById(retItem.itemId).session(dbSession);
        if (item) {
          item.quantity = (item.quantity || 0) + retItem.quantity;

          // Add back to batch if possible
          if (item.batches && item.batches.length > 0 && item.batches[0]) {
            // Find the oldest batch or create a "Returns" batch
            item.batches[0].quantity =
              (item.batches[0].quantity || 0) + retItem.quantity;
          }

          await item.save({ session: dbSession });
        }
      }
    }

    // 3. Decrease customer outstanding balance
    const customer = await Customer.findById(sale.customerId).session(
      dbSession,
    );
    if (customer) {
      customer.creditBalance =
        (customer.creditBalance || 0) - totalReturnAmount;
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
    return NextResponse.json(
      { success: true, data: salesReturn },
      { status: 201 },
    );
  } catch (err: any) {
    await dbSession.abortTransaction();
    console.error("[POST /api/sales/returns]", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  } finally {
    dbSession.endSession();
  }
}
