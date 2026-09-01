import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import SaleReturn from "@/models/SaleReturn";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const query: any = {};
    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: "i" } },
        { returnNumber: { $regex: search, $options: "i" } },
        { "items.itemName": { $regex: search, $options: "i" } },
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

    const returns = await SaleReturn.find(query).sort({ date: -1 }).lean();

    const returnedItems: any[] = [];
    returns.forEach((ret: any) => {
      ret.items.forEach((item: any) => {
        const matchesSearch =
          !search ||
          ret.customerName.toLowerCase().includes(search.toLowerCase()) ||
          ret.returnNumber.toLowerCase().includes(search.toLowerCase()) ||
          item.itemName.toLowerCase().includes(search.toLowerCase());

        if (matchesSearch) {
          returnedItems.push({
            returnId: ret._id,
            returnNumber: ret.returnNumber,
            customerName: ret.customerName,
            date: ret.date || ret.createdAt,
            itemName: item.itemName,
            itemNumber: item.itemNumber || "—",
            quantity: item.quantity,
            price: item.price,
            batch: item.batch || "—",
            reason: item.reason || ret.reason || "—",
            total: item.total,
          });
        }
      });
    });

    const total = returnedItems.length;
    const paginatedItems = returnedItems.slice(skip, skip + limit);

    return NextResponse.json({
      success: true,
      data: paginatedItems,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    console.error("[GET /api/items/returned]", err);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 },
    );
  }
}
