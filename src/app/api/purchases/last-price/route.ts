import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Purchase from "@/models/Purchase";
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

    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("itemId");

    if (!itemId) {
      return NextResponse.json(
        { success: false, error: "Missing itemId" },
        { status: 400 },
      );
    }

    await connectDB();

    const lastPurchase = await Purchase.findOne({
      "items.itemId": itemId,
    })
      .sort({ date: -1, createdAt: -1 })
      .lean();

    if (!lastPurchase) {
      return NextResponse.json({ success: true, lastPrice: null });
    }

    const purchaseItem = (lastPurchase as any).items.find(
      (item: any) => item.itemId.toString() === itemId,
    );

    return NextResponse.json({
      success: true,
      lastPrice: purchaseItem ? purchaseItem.price : null,
      date: lastPurchase.date,
      supplierName: lastPurchase.supplierName,
    });
  } catch (err) {
    console.error("[GET /api/purchases/last-price]", err);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 },
    );
  }
}
