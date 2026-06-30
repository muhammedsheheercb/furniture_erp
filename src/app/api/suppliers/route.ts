import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Supplier from "@/models/Supplier";
import User from "@/models/User";
import { generateUniqueNumber } from "../../../lib/utils";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/suppliers
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
    const skip      = (page - 1) * limit;

    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { supplierNumber: { $regex: search, $options: "i" } },
      ];
    }
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const [suppliers, total] = await Promise.all([
      Supplier.find(query)
        .populate("createdBy", "name")
        .populate("updatedBy", "name")
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      Supplier.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: suppliers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("[GET /api/suppliers]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

// POST /api/suppliers
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const body = await req.json();
    const supplierNumber = body.supplierNumber || generateUniqueNumber("SUP");
    const openingBalance = Number(body.openingBalance || 0);

    const supplier = await Supplier.create({ 
        ...body, 
        supplierNumber,
        openingBalance,
        creditBalance: openingBalance,
        createdBy: session.user.id,
        updatedBy: session.user.id,
        balanceHistory: openingBalance !== 0 ? [{
            date: new Date(),
            amount: openingBalance,
            type: "adjustment",
            note: "Initial Opening Balance"
        }] : []
    });
    return NextResponse.json({ success: true, data: supplier }, { status: 201 });
  } catch (err: unknown) {
    console.error("[POST /api/suppliers]", err);
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}