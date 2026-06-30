import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Production from "@/models/Production";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import mongoose from "mongoose";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "5", 10);
    const skip = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "Invalid worker ID" }, { status: 400 });
    }

    const workerObjectId = new mongoose.Types.ObjectId(id);

    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Find all production jobs assigned to this worker using $or to match either ObjectId or string form
    const query: any = {
      $or: [
        { workerId: workerObjectId },
        { workerId: id }
      ]
    };
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const ed = new Date(endDate);
        ed.setHours(23, 59, 59, 999);
        query.createdAt.$lte = ed;
      }
    }

    const total = await Production.countDocuments(query);
    const jobs = await Production.find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "saleId",
        select: "customerMobile customerAddress deliveryAddress"
      })
      .lean();

    return NextResponse.json({
      success: true,
      data: jobs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err: any) {
    console.error("[GET /api/workers/:id/work]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
