import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import SaleRaw from "@/models/Sale";
const Sale = SaleRaw as any;
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

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
        { saleNumber: { $regex: search, $options: "i" } },
        { "items.itemName": { $regex: search, $options: "i" } }
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

    const sales = await Sale.find(query)
      .sort({ date: -1 })
      .lean();

    const soldItems: any[] = [];
    sales.forEach((sale: any) => {
      sale.items.forEach((item: any) => {
        const matchesSearch = !search || 
          sale.customerName.toLowerCase().includes(search.toLowerCase()) ||
          sale.saleNumber.toLowerCase().includes(search.toLowerCase()) ||
          item.itemName.toLowerCase().includes(search.toLowerCase());

        if (matchesSearch) {
          soldItems.push({
            saleId: sale._id,
            saleNumber: sale.saleNumber,
            customerName: sale.customerName,
            date: sale.date || sale.createdAt,
            itemName: item.itemName,
            itemNumber: item.itemNumber || "—",
            quantity: item.quantity,
            price: item.price,
            color: item.color || "—",
            size: item.size || "—",
            total: item.total
          });
        }
      });
    });

    const total = soldItems.length;
    const paginatedItems = soldItems.slice(skip, skip + limit);

    return NextResponse.json({
      success: true,
      data: paginatedItems,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err: any) {
    console.error("[GET /api/items/sold]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
