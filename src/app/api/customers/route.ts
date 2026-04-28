import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Customer from "@/models/Customer";
import User from "@/models/User";
import { generateUniqueNumber } from "../../../lib/utils";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/customers
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const { searchParams } = new URL(req.url);
    const search    = searchParams.get("search") || "";
    const page      = parseInt(searchParams.get("page") || "1");
    const limit     = parseInt(searchParams.get("limit") || "10");
    const sortBy    = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1;
    const startDate = searchParams.get("startDate");
    const endDate   = searchParams.get("endDate");
    const purchaseFilter = searchParams.get("purchaseFilter"); // 'higher' or 'lower'
    const skip      = (page - 1) * limit;

    let matchQuery: any = {};
    if (search) {
      matchQuery.$or = [
        { name: { $regex: search, $options: "i" } },
        { customerNumber: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } },
      ];
    }

    // Default sortBy
    let sortQuery: any = { [sortBy]: sortOrder };
    if (purchaseFilter) {
      sortQuery = { totalPurchases: purchaseFilter === "higher" ? -1 : 1 };
    }

    const pipeline: any[] = [
      { $match: matchQuery },
      // Lookup sales to calculate purchase volume
      {
        $lookup: {
          from: "sales",
          let: { customerId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$customerId", "$$customerId"] },
                ...(startDate || endDate ? {
                  date: {
                    ...(startDate ? { $gte: new Date(startDate) } : {}),
                    ...(endDate ? { $lte: new Date(`${endDate}T23:59:59.999Z`) } : {}),
                  }
                } : {})
              }
            },
            { $group: { _id: null, total: { $sum: "$total" } } }
          ],
          as: "purchaseStats"
        }
      },
      {
        $addFields: {
          totalPurchases: { $ifNull: [{ $arrayElemAt: ["$purchaseStats.total", 0] }, 0] }
        }
      },
      { $sort: sortQuery },
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [
            { $skip: skip },
            { $limit: limit },
            {
              $lookup: {
                from: "users",
                localField: "createdBy",
                foreignField: "_id",
                as: "createdBy"
              }
            },
            {
              $lookup: {
                from: "users",
                localField: "updatedBy",
                foreignField: "_id",
                as: "updatedBy"
              }
            },
            {
              $addFields: {
                createdBy: { $arrayElemAt: ["$createdBy", 0] },
                updatedBy: { $arrayElemAt: ["$updatedBy", 0] }
              }
            }
          ]
        }
      }
    ];

    const results = await Customer.aggregate(pipeline);
    const customers = results[0].data;
    const total = results[0].metadata[0]?.total || 0;

    return NextResponse.json({
      success: true,
      data: customers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("[GET /api/customers]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

// POST /api/customers
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { creditBalance, balanceHistory, ...safeBody } = await req.json();
    const customerNumber = safeBody.customerNumber || generateUniqueNumber("CUST");
    const openingBalance = Number(safeBody.openingBalance || 0);

    const customer = await Customer.create({ 
        ...safeBody, 
        customerNumber,
        openingBalance,
        creditBalance: openingBalance,
        createdBy: session.user.id,
        updatedBy: session.user.id,
        balanceHistory: openingBalance !== 0 ? [{
            date: new Date(),
            amount: openingBalance,
            type: "adjustment",
            paymentMethod: "credit",
            note: "Opening Balance"
        }] : []
    });

    // Re-fetch to ensure the full document with schema defaults and historical updates is returned
    const fullCustomer = await Customer.findById(customer._id).lean();

    return NextResponse.json({ success: true, data: fullCustomer }, { status: 201 });
  } catch (err: unknown) {
    console.error("[POST /api/customers]", err);
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}