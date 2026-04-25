import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Sale from "@/models/Sale";
import User from "@/models/User";
import Item from "@/models/Item";
import Customer from "@/models/Customer";
import { generateUniqueNumber } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import mongoose from "mongoose";

// GET /api/sales
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const { searchParams } = new URL(req.url);
    const search      = searchParams.get("search") || "";
    const page        = parseInt(searchParams.get("page") || "1");
    const limit       = parseInt(searchParams.get("limit") || "10");
    const sortBy      = searchParams.get("sortBy") || "createdAt";
    const sortOrder   = searchParams.get("sortOrder") === "asc" ? 1 : -1;
    const startDate   = searchParams.get("startDate");
    const endDate     = searchParams.get("endDate");
    const month       = searchParams.get("month");
    const year        = searchParams.get("year");
    const paymentType = searchParams.get("paymentType");
    const skip        = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = {};

    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: "i" } },
        { saleNumber: { $regex: search, $options: "i" } },
      ];
    }
    if (paymentType) query.paymentType = paymentType;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate)   query.date.$lte = new Date(endDate);
    } else if (month && year) {
      const m = parseInt(month), y = parseInt(year);
      query.date = {
        $gte: new Date(y, m - 1, 1),
        $lte: new Date(y, m, 0, 23, 59, 59),
      };
    } else if (year) {
      const y = parseInt(year);
      query.date = { $gte: new Date(y, 0, 1), $lte: new Date(y, 11, 31, 23, 59, 59) };
    }

    const [sales, total, totalAmountResult] = await Promise.all([
      Sale.find(query)
        .populate("createdBy", "name")
        .populate("updatedBy", "name")
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      Sale.countDocuments(query),
      Sale.aggregate([{ $match: query }, { $group: { _id: null, total: { $sum: "$total" } } }]),
    ]);

    const totalAmount = totalAmountResult[0]?.total ?? 0;

    return NextResponse.json({
      success: true,
      data: sales,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      totalAmount,
    });
  } catch (err) {
    console.error("[GET /api/sales]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

// POST /api/sales
export async function POST(req: NextRequest) {
  const dbSession = await mongoose.startSession();
  dbSession.startTransaction();
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const body = await req.json();
    const lastSale = await Sale.findOne({ 
      saleNumber: { $regex: /^(sale-|SALE-)\d{3,6}$/ } 
    }).sort({ createdAt: -1 }).session(dbSession);
    
    let nextNum = 100;
    if (lastSale && lastSale.saleNumber) {
      const lastNumString = lastSale.saleNumber.replace("sale-", "").replace("SALE-", "");
      const lastNum = parseInt(lastNumString);
      if (!isNaN(lastNum)) {
        nextNum = lastNum + 1;
      }
    }
    const saleNumber = `sale-${nextNum.toString().padStart(3, "0")}`;

    // 1 — create sale
    const [sale] = await Sale.create([{ 
        ...body, 
        saleNumber,
        createdBy: session.user.id,
        updatedBy: session.user.id
    }], { session: dbSession });

    // 2 — decrease item quantities and batches (manual or FIFO)
    for (const saleItem of body.items) {
      const item = await Item.findById(saleItem.itemId).session(dbSession);
      if (!item) throw new Error(`Item not found: ${saleItem.itemName}`);
      if ((item.quantity || 0) < saleItem.quantity) {
        throw new Error(`Insufficient stock for item: ${saleItem.itemName} (Available: ${item.quantity || 0}, Requested: ${saleItem.quantity})`);
      }

      // Update total quantity
      item.quantity = (item.quantity || 0) - saleItem.quantity;

      // Update batches (Manual Selection if provided, else FIFO)
      if (item.batches && item.batches.length > 0) {
        if (saleItem.batch) {
          // Find specific batch - match by batchNumber
          const batch = item.batches.find((b: any) => b.batchNumber === saleItem.batch);
          if (batch) {
            batch.quantity -= saleItem.quantity;
          } else {
            // Fallback to FIFO if batch name not found
            let remainingToDeduct = saleItem.quantity;
            item.batches.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            for (const b of item.batches) {
              if (remainingToDeduct <= 0) break;
              const deductFromThisBatch = Math.min(b.quantity, remainingToDeduct);
              b.quantity -= deductFromThisBatch;
              remainingToDeduct -= deductFromThisBatch;
            }
          }
        } else {
          // FIFO as before
          let remainingToDeduct = saleItem.quantity;
          item.batches.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

          for (const batch of item.batches) {
            if (remainingToDeduct <= 0) break;
            const deductFromThisBatch = Math.min(batch.quantity, remainingToDeduct);
            batch.quantity -= deductFromThisBatch;
            remainingToDeduct -= deductFromThisBatch;
          }
        }
      }

      await item.save({ session: dbSession });
    }

    // 3 — if credit sale, increase customer credit balance and record history
    if (body.paymentType === "credit") {
      const customer = await Customer.findById(body.customerId).session(dbSession);
      if (customer) {
        if (!customer.balanceHistory) customer.balanceHistory = [];
        
        customer.creditBalance = (customer.creditBalance || 0) + Number(body.total);
        customer.balanceHistory.push({
          date: new Date(),
          amount: Number(body.total),
          type: "adjustment",
          paymentMethod: "credit",
          note: "Sales Entry"
        });

        await customer.save({ session: dbSession });
      }
    }

    await dbSession.commitTransaction();
    return NextResponse.json({ success: true, data: sale }, { status: 201 });
  } catch (err: unknown) {
    await dbSession.abortTransaction();
    console.error("[POST /api/sales]", err);
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  } finally {
    dbSession.endSession();
  }
}