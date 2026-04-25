import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Sale from "@/models/Sale";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("customerId");
    const itemId = searchParams.get("itemId");

    if (!customerId || !itemId) {
      return NextResponse.json({ success: false, error: "Missing customerId or itemId" }, { status: 400 });
    }

    await connectDB();

    // Find the last sale for this customer and item
    // We search across all Sales where the items array contains an item with itemId
    const lastSale = await Sale.findOne({
      customerId,
      "items.itemId": itemId
    }).sort({ date: -1, createdAt: -1 }).lean();

    if (!lastSale) {
      return NextResponse.json({ success: true, lastPrice: null });
    }

    // Extract the price for that specific item from the sale
    // A sale could have multiple items, we need the one matching itemId
    // (If there are multiple rows of same item in one sale, we pick the first one's price)
    const saleItem = (lastSale as any).items.find((item: any) => item.itemId.toString() === itemId);

    return NextResponse.json({
      success: true,
      lastPrice: saleItem ? saleItem.price : null,
      date: lastSale.date
    });
  } catch (err) {
    console.error("[GET /api/sales/last-price]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
