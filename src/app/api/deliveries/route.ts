import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Delivery from "@/models/Delivery";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const deliveries = await Delivery.find().sort({ createdAt: -1 }).lean();

    return NextResponse.json({ success: true, data: deliveries });
  } catch (err) {
    console.error("[GET /api/deliveries]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
