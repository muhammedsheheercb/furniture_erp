import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Item from "@/models/Item";
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

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 7);

    const expiringBatches = await Item.aggregate([
      { $unwind: "$batches" },
      {
        $match: {
          "batches.quantity": { $gt: 0 },
          "batches.expiryDate": { $lte: targetDate, $type: "date" },
        },
      },
      {
        $project: {
          _id: 1,
          itemNumber: 1,
          name: 1,
          batch: "$batches",
        },
      },
      { $sort: { "batch.expiryDate": 1 } },
    ]);

    return NextResponse.json({ success: true, data: expiringBatches });
  } catch (e) {
    console.error("[GET /api/reports/expiry]", e);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 },
    );
  }
}
