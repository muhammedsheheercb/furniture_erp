import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Purchase from "@/models/Purchase";
import User from "@/models/User";
import Item from "@/models/Item";
import Supplier from "@/models/Supplier";
import { generateUniqueNumber } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import mongoose from "mongoose";

// GET /api/purchases
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
        { supplierName: { $regex: search, $options: "i" } },
        { purchaseNumber: { $regex: search, $options: "i" } },
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

    const [purchases, total, totalAmountResult] = await Promise.all([
      Purchase.find(query)
        .populate("createdBy", "name")
        .populate("updatedBy", "name")
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      Purchase.countDocuments(query),
      Purchase.aggregate([{ $match: query }, { $group: { _id: null, total: { $sum: "$total" } } }]),
    ]);

    const totalAmount = totalAmountResult[0]?.total ?? 0;

    return NextResponse.json({
      success: true,
      data: purchases,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      totalAmount,
    });
  } catch (err) {
    console.error("[GET /api/purchases]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

// POST /api/purchases
export async function POST(req: NextRequest) {
  const dbSession = await mongoose.startSession();
  dbSession.startTransaction();
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const body = await req.json();
    const lastPurchase = await Purchase.findOne({ 
      purchaseNumber: { $regex: /^(pur-|PUR-)\d{3,6}$/ } 
    }).sort({ createdAt: -1 }).session(dbSession);
    
    let nextNum = 100;
    if (lastPurchase && lastPurchase.purchaseNumber) {
      const lastNumString = lastPurchase.purchaseNumber.replace("pur-", "").replace("PUR-", "");
      const lastNum = parseInt(lastNumString);
      if (!isNaN(lastNum)) {
        nextNum = lastNum + 1;
      }
    }
    const purchaseNumber = `PUR-${nextNum.toString().padStart(3, "0")}`;

    // 1 — create purchase
    const [purchase] = await Purchase.create([{ 
        ...body, 
        purchaseNumber,
        createdBy: session.user.id,
        updatedBy: session.user.id
    }], { session: dbSession });
    if (!purchase) throw new Error("Failed to create purchase record");

    // 2 — increase item quantities and update dates
    for (const purchaseItem of body.items) {
      await Item.findByIdAndUpdate(
        purchaseItem.itemId,
        { 
          $inc: { quantity: purchaseItem.quantity },
          $set: { 
            purchaseAmount: purchaseItem.price,
            salesAmount: purchaseItem.sellingPrice,
            manufacturingDate: purchaseItem.manufacturingDate,
            expiryDate: purchaseItem.expiryDate 
          },
          $push: {
            batches: {
              purchaseId: purchase._id,
              purchaseNumber: purchase.purchaseNumber,
              batchNumber: purchaseItem.batch,
              manufacturingDate: purchaseItem.manufacturingDate,
              expiryDate: purchaseItem.expiryDate,
              purchasePrice: purchaseItem.price,
              salePrice: purchaseItem.sellingPrice,
              quantity: purchaseItem.quantity,
              createdAt: new Date()
            }
          }
        },
        { session: dbSession, new: true }
      );
    }

    // 3 — if credit purchase, increase supplier credit balance and record history
    if (body.paymentType === "credit") {
      await Supplier.findByIdAndUpdate(
        body.supplierId,
        { 
          $inc: { creditBalance: body.total },
          $push: { 
            balanceHistory: {
              date: new Date(),
              amount: body.total,
              type: "adjustment",
              paymentMethod: "credit", // Explicit mode
              note: `Purchase #${purchaseNumber}`
            }
          }
        },
        { session: dbSession }
      );
    }

    await dbSession.commitTransaction();
    return NextResponse.json({ success: true, data: purchase }, { status: 201 });
  } catch (err: unknown) {
    await dbSession.abortTransaction();
    console.error("[POST /api/purchases]", err);
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  } finally {
    dbSession.endSession();
  }
}