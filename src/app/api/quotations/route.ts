import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Quotation from "@/models/Quotation";

function genQuotationNumber(seq: number) {
  return `QT-${String(seq).padStart(5, "0")}`;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "15");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const deliveryStatus = searchParams.get("deliveryStatus") || "";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1;

    const filter: any = {};
    if (search) {
      filter.$or = [
        { customerName: { $regex: search, $options: "i" } },
        { quotationNumber: { $regex: search, $options: "i" } },
      ];
    }
    if (status) filter.status = status;
    if (deliveryStatus) filter.deliveryStatus = deliveryStatus;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) { const ed = new Date(endDate); ed.setHours(23, 59, 59, 999); filter.date.$lte = ed; }
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Quotation.find(filter)
        .populate("createdBy", "name")
        .populate("updatedBy", "name")
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      Quotation.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true, data, total,
      page, limit, totalPages: Math.ceil(total / limit),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const body = await req.json();

    const count = await Quotation.countDocuments();
    const quotationNumber = genQuotationNumber(count + 1);

    const quotation = await Quotation.create({
      ...body,
      quotationNumber,
      createdBy: (session.user as any)?.id,
    });

    return NextResponse.json({ success: true, data: quotation }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
