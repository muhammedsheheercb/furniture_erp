import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Quotation from "@/models/Quotation";

function genQuotationNumber(seq: number) {
  return `QT-${String(seq).padStart(5, "0")}`;
}

/**
 * Allocate the next number atomically. The counter is advanced to at least
 * the current quotation count first, which also repairs counters initialized
 * before this endpoint was deployed (and after deletions/reseed operations).
 */
async function nextQuotationNumber() {
  const counterCollection = Quotation.db.collection<{ _id: string; seq?: number }>(
    "counters",
  );
  const existingCount = await Quotation.countDocuments();

  await counterCollection.updateOne(
    { _id: "quotationNumber" },
    { $max: { seq: existingCount } },
    { upsert: true },
  );

  const counter = await counterCollection.findOneAndUpdate(
    { _id: "quotationNumber" },
    { $inc: { seq: 1 } },
    { returnDocument: "after" },
  );

  if (!counter || typeof counter.seq !== "number") {
    throw new Error("Unable to allocate a quotation number");
  }

  return genQuotationNumber(counter.seq);
}

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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "15");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const deliveryStatus = searchParams.get("deliveryStatus") || "";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const converted = searchParams.get("converted");
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
    if (converted === "false") filter.convertedToSaleId = { $exists: false };
    if (converted === "true") filter.convertedToSaleId = { $exists: true };
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) {
        const ed = new Date(endDate);
        ed.setHours(23, 59, 59, 999);
        filter.date.$lte = ed;
      }
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Quotation.find(filter)
        .populate("createdBy", "name")
        .populate("updatedBy", "name")
        .populate("customerId", "customerNumber")
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      Quotation.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );

    await connectDB();
    const body = await req.json();

    let quotation;
    // A counter seeded from the quotation count can lag behind after a
    // deleted/reseeded database. If the unique index catches that case (or
    // a request already in flight during deployment), advance and retry.
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const quotationNumber = await nextQuotationNumber();
      try {
        quotation = await Quotation.create({
          ...body,
          quotationNumber,
          createdBy: (session.user as any)?.id,
        });
        break;
      } catch (err: any) {
        if (err?.code !== 11000 || attempt === 2) throw err;
      }
    }

    if (!quotation) throw new Error("Unable to create quotation");

    return NextResponse.json(
      { success: true, data: quotation },
      { status: 201 },
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
