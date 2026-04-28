import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Production from "@/models/Production";
import Delivery from "@/models/Delivery";
import Sale from "@/models/Sale";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const { status, remarks } = await req.json();

    const production = await Production.findById(id);
    if (!production) return NextResponse.json({ success: false, error: "Production not found" }, { status: 404 });

    production.status = status;
    if (remarks) production.remarks = remarks;
    
    // Update linked sale status
    if (status === "processing") {
        await Sale.findByIdAndUpdate(production.saleId, { status: "processing" });
    } else if (status === "finished") {
        await Sale.findByIdAndUpdate(production.saleId, { status: "delivered" });
    }

    // If status is finished, create delivery entry
    if (status === "finished") {
        const existingDelivery = await Delivery.findOne({ saleId: production.saleId });
        if (!existingDelivery) {
            await Delivery.create({
                saleId: production.saleId,
                saleNumber: production.saleNumber,
                customerId: production.customerId,
                customerName: production.customerName,
                items: production.items.map(it => ({
                    itemName: it.itemName,
                    quantity: it.quantity,
                    status: "pending"
                })),
                status: "pending"
            });
        }
    }

    await production.save();
    return NextResponse.json({ success: true, data: production });
  } catch (err) {
    console.error("[PUT /api/production/:id]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
