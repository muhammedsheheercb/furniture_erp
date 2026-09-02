import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Purchaser from "@/models/Purchaser";
import Purchase from "@/models/Purchase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const withStats = searchParams.get("withStats") === "true";
    
    const query = search ? { name: { $regex: search, $options: "i" } } : {};
    
    let purchasers: any[] = await Purchaser.find(query).sort({ name: 1 }).lean();

    if (withStats) {
      // Get current month purchases for each purchaser
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      const purchases = await Purchase.aggregate([
        {
          $match: {
            date: { $gte: startOfMonth, $lte: endOfMonth },
            purchaserId: { $ne: null }
          }
        },
        {
          $group: {
            _id: "$purchaserId",
            monthlyTotal: { $sum: "$total" }
          }
        }
      ]);

      const statsMap = purchases.reduce((acc, p) => {
        acc[p._id.toString()] = p.monthlyTotal;
        return acc;
      }, {} as Record<string, number>);

      purchasers = purchasers.map(p => ({
        ...p,
        monthlyTotal: statsMap[p._id.toString()] || 0
      }));
    }

    return NextResponse.json({ success: true, data: purchasers });
  } catch (err) {
    console.error("[GET /api/purchasers]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const body = await req.json();
    if (!body.name) return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 });

    const purchaser = await Purchaser.create(body);
    return NextResponse.json({ success: true, data: purchaser }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/purchasers]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
