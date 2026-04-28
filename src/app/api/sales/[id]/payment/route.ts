import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Sale from "@/models/Sale";
import Customer from "@/models/Customer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const { amount, note } = await req.json();

    if (!amount || isNaN(amount)) {
      return NextResponse.json({ success: false, error: "Invalid amount" }, { status: 400 });
    }

    const sale = await Sale.findById(id);
    if (!sale) return NextResponse.json({ success: false, error: "Sale not found" }, { status: 404 });

    const newAdvancePaid = (sale.advancePaid || 0) + Number(amount);
    
    // Ensure we don't overpay (optional, but good practice)
    // if (newAdvancePaid > sale.total) {
    //   return NextResponse.json({ success: false, error: "Payment exceeds balance" }, { status: 400 });
    // }

    sale.advancePaid = newAdvancePaid;
    
    // If balance is fully paid, update status to closed if it was delivered or invoiced?
    // The user said: "if the balnce amount add full then order order status field ther show order close other wise show balnce amount pending"
    // I'll update the status in DB if needed, but the UI will definitely show it.
    
    await sale.save();

    // If it's a credit sale, we might want to update the customer's credit balance too
    if (sale.paymentType === "credit" && sale.customerId) {
        await Customer.findByIdAndUpdate(sale.customerId, {
            $inc: { creditBalance: -amount },
            $push: {
                balanceHistory: {
                    date: new Date(),
                    amount: -amount,
                    type: "payment",
                    note: note || `Payment for Sale #${sale.saleNumber}`
                }
            }
        });
    }

    return NextResponse.json({ success: true, data: sale });
  } catch (err) {
    console.error("[POST /api/sales/:id/payment]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
