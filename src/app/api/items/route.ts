import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Item from "@/models/Item";
import Material from "@/models/Material";
import User from "@/models/User";
import { generateUniqueNumber } from "../../../lib/utils";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

// GET /api/items
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    if (!(await hasPermission("items", "view"))) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

    await connectDB();

    const { searchParams } = new URL(req.url);
    const search   = searchParams.get("search") || "";
    const page     = parseInt(searchParams.get("page") || "1");
    const limit    = parseInt(searchParams.get("limit") || "10");
    const sortBy   = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1;
    const category = searchParams.get("category") || "";
    const skip     = (page - 1) * limit;

    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { itemNumber: { $regex: search, $options: "i" } },
      ];
    }
    if (category) {
      query.category = category;
    }

    const [items, total, summary] = await Promise.all([
      Item.find(query)
        .populate("createdBy", "name")
        .populate("updatedBy", "name")
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      Item.countDocuments(query),
      Item.aggregate([
        { $match: query },
        { $group: { _id: null, totalAmount: { $sum: { $multiply: ["$purchaseAmount", "$quantity"] } } } }
      ])
    ]);

    const totalAmount = summary[0]?.totalAmount || 0;

    return NextResponse.json({
      success: true,
      data: items,
      total,
      totalAmount,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("[GET /api/items]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

// POST /api/items
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    if (!(await hasPermission("items", "create"))) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

    await connectDB();
    const body = await req.json();

    const itemNumber = body.itemNumber || generateUniqueNumber("ITM");

    const itemData = { 
      ...body, 
      itemNumber,
      salesAmount: Number(body.salesAmount) || 0,
      purchaseAmount: Number(body.purchaseAmount) || 0,
      mrp: Number(body.mrp) || 0,
      quantity: Number(body.quantity) || 0,
      reorderLevel: Number(body.reorderLevel) || 0,
      taxRate: Number(body.taxRate) || 0,
      leadTime: Number(body.leadTime) || 0,
      createdBy: session.user.id,
      updatedBy: session.user.id,
    };

    if (itemData.quantity > 0) {
      itemData.batches = [{
        purchaseNumber: "OPENING",
        batchNumber: body.batchNumber || "OPN-INT",
        manufacturingDate: body.manufacturingDate,
        expiryDate: body.expiryDate,
        purchasePrice: body.purchaseAmount ?? 0,
        salePrice: body.salesAmount ?? 0,
        quantity: body.quantity ?? 0,
        createdAt: body.batchDate ? new Date(body.batchDate) : new Date()
      }];
    }

    const item = await Item.create(itemData);

    // Deduct BOM quantities from material batch stock (only for manufactured products)
    const bomRows = (body.bom || []).filter(
      (r: any) => r.materialId && r.batchNumber && Number(r.quantity) > 0
    );
    if (bomRows.length > 0) {
      await Promise.all(
        bomRows.map((r: any) =>
          Material.updateOne(
            { _id: r.materialId, "batches.batchNumber": r.batchNumber },
            {
              $inc: {
                currentStock: -Number(r.quantity),
                "batches.$.quantity": -Number(r.quantity),
              },
            }
          )
        )
      );
    }

    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (err: unknown) {
    console.error("[POST /api/items]", err);
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}