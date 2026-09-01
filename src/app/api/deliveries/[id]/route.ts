import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Delivery from "@/models/Delivery";
import Sale from "@/models/Sale";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );

    await connectDB();
    const { id } = await params;
    const { status, remarks, deliveryPartner, driverName, driverContact } =
      await req.json();

    const delivery = await Delivery.findById(id);
    if (!delivery)
      return NextResponse.json(
        { success: false, error: "Delivery not found" },
        { status: 404 },
      );

    delivery.status = status;
    if (status === "delivered") {
      delivery.deliveryDate = new Date();
      delivery.items.forEach((it) => (it.status = "delivered"));

      // Update linked sale status
      await Sale.findByIdAndUpdate(delivery.saleId, { status: "invoiced" });
    }
    if (remarks) delivery.remarks = remarks;
    if (deliveryPartner) delivery.deliveryPartner = deliveryPartner;
    if (driverName) delivery.driverName = driverName;
    if (driverContact) delivery.driverContact = driverContact;

    await delivery.save();
    return NextResponse.json({ success: true, data: delivery });
  } catch (err) {
    console.error("[PUT /api/deliveries/:id]", err);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 },
    );
  }
}
