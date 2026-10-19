import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Customer from "@/models/Customer";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const mobile = new URL(req.url).searchParams.get("mobile")?.trim();
    if (!mobile) {
      return NextResponse.json({ success: false, error: "Mobile number is required" }, { status: 400 });
    }
    await connectDB();
    const customer = await Customer.findOne({ mobile }).lean();
    return NextResponse.json({ success: true, data: customer });
  } catch (error) {
    console.error("[GET /api/customers/by-mobile]", error);
    return NextResponse.json({ success: false, error: "Unable to look up customer" }, { status: 500 });
  }
}
