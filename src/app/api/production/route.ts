import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Production from "@/models/Production";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    
    const query: any = {};
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const ed = new Date(endDate);
        ed.setHours(23, 59, 59, 999);
        query.createdAt.$lte = ed;
      }
    }

    const productions = await Production.find(query)
      .populate({
        path: "saleId",
        populate: { path: "createdBy", select: "name" }
      })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: productions });
  } catch (err) {
    console.error("[GET /api/production]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
