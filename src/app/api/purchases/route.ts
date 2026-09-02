import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Purchase from "@/models/Purchase";
import Item from "@/models/Item";
import Material from "@/models/Material";
import Supplier from "@/models/Supplier";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import mongoose from "mongoose";

// GET /api/purchases
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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const paymentType = searchParams.get("paymentType");
    const purchaserId = searchParams.get("purchaserId");
    const skip = (page - 1) * limit;

    const query: Record<string, any> = {};
    if (purchaserId) query.purchaserId = purchaserId;
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
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    } else if (month && year) {
      const m = parseInt(month),
        y = parseInt(year);
      query.date = {
        $gte: new Date(y, m - 1, 1),
        $lte: new Date(y, m, 0, 23, 59, 59),
      };
    } else if (year) {
      const y = parseInt(year);
      query.date = {
        $gte: new Date(y, 0, 1),
        $lte: new Date(y, 11, 31, 23, 59, 59),
      };
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
      Purchase.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
    ]);

    return NextResponse.json({
      success: true,
      data: purchases,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      totalAmount: totalAmountResult[0]?.total ?? 0,
    });
  } catch (err) {
    console.error("[GET /api/purchases]", err);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 },
    );
  }
}

// POST /api/purchases
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

    // Generate purchase number
    const lastPurchase = await Purchase.findOne({
      purchaseNumber: { $regex: /^PUR-\d+$/ },
    })
      .sort({ createdAt: -1 })
      .session(dbSession);

    let nextNum = 100;
    if (lastPurchase?.purchaseNumber) {
      const n = parseInt(lastPurchase.purchaseNumber.replace("PUR-", ""));
      if (!isNaN(n)) nextNum = n + 1;
    }
    const purchaseNumber = `PUR-${nextNum.toString().padStart(3, "0")}`;

    // Create purchase
    const [purchase] = await Purchase.create(
      [
        {
          ...body,
          purchaseNumber,
          createdBy: session.user.id,
          updatedBy: session.user.id,
        },
      ],
      { session: dbSession },
    );
    if (!purchase) throw new Error("Failed to create purchase record");

    const batchBase = `B${Date.now()}`;

    // Update stock for each item
    for (let i = 0; i < body.items.length; i++) {
      const pi = body.items[i];
      const batchNumber = pi.batch || `${batchBase}-${i + 1}`;

      if (pi.itemType === "material" && pi.materialId) {
        await Material.findByIdAndUpdate(
          pi.materialId,
          {
            $inc: { currentStock: pi.quantity },
            $set: { lastPurchasePrice: pi.price },
            $push: {
              batches: {
                purchaseId: String(purchase._id),
                purchaseNumber: purchase.purchaseNumber,
                batchNumber,
                purchaseDate: body.date ? new Date(body.date) : new Date(),
                purchasePrice: pi.price,
                quantity: pi.quantity,
                createdAt: new Date(),
              },
            },
          },
          { session: dbSession },
        );
      } else if (pi.itemId) {
        await Item.findByIdAndUpdate(
          pi.itemId,
          {
            $inc: { quantity: pi.quantity },
            $set: {
              purchaseAmount: pi.price,
              salesAmount: pi.sellingPrice || pi.price,
              manufacturingDate: pi.manufacturingDate,
              expiryDate: pi.expiryDate,
            },
            $push: {
              batches: {
                purchaseId: String(purchase._id),
                purchaseNumber: purchase.purchaseNumber,
                batchNumber,
                manufacturingDate: pi.manufacturingDate,
                expiryDate: pi.expiryDate,
                purchasePrice: pi.price,
                salePrice: pi.sellingPrice || pi.price,
                quantity: pi.quantity,
                createdAt: new Date(),
              },
            },
          },
          { session: dbSession },
        );
      }
    }

    // Track unpaid balance against supplier for any payment type
    const unpaidBalance = Number(body.total) - Number(body.paidAmount || 0);
    if (unpaidBalance > 0) {
      await Supplier.findByIdAndUpdate(
        body.supplierId,
        {
          $inc: { creditBalance: unpaidBalance },
          $push: {
            balanceHistory: {
              date: new Date(),
              amount: unpaidBalance,
              type: "adjustment",
              paymentMethod: body.paymentType,
              note: `Purchase #${purchaseNumber} — Balance due (Bill: ${body.total}, Paid: ${body.paidAmount || 0}) OMR`,
            },
          },
        },
        { session: dbSession },
      );
    }

    await dbSession.commitTransaction();
    return NextResponse.json(
      { success: true, data: purchase },
      { status: 201 },
    );
  } catch (err: unknown) {
    await dbSession.abortTransaction();
    console.error("[POST /api/purchases]", err);
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  } finally {
    dbSession.endSession();
  }
}
