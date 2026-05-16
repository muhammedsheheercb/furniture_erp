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
    
    const query: any = {};
    if (status) query.status = status;

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
