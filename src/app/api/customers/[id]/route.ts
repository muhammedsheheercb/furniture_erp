import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Customer from "@/models/Customer";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

// GET /api/customers/:id
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const customer = await Customer.findById(id)
      .populate("createdBy", "name")
      .populate("updatedBy", "name")
      .lean();
    if (!customer) return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });

    // For safety, initialize fields if they missing
    const history = customer.balanceHistory || [];
    const credit  = customer.creditBalance || 0;
    const opening = customer.openingBalance || 0;

    // AUTO-POPULATE FIX: Ensure history contains records if there is a balance.
    // If history is totally empty but there's an opening or current balance, show it!
    if (history.length === 0 && (opening !== 0 || credit !== 0)) {
      history.push({
        date: customer.createdAt || new Date(),
        amount: Math.abs(opening !== 0 ? opening : credit),
        type: (opening !== 0 ? opening : credit) > 0 ? "adjustment" : "payment",
        note: opening !== 0 ? "Opening Balance" : "Legacy Balance Adjustment",
        paymentMethod: "credit" 
      } as any);
    }

    return NextResponse.json({ 
        success: true, 
        data: {
          ...customer,
          openingBalance: opening,
          creditBalance: credit,
          balanceHistory: history.length > 0 ? history : [] 
        } 
    });
  } catch (err) {
    console.error("[GET /api/customers/:id]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

// PUT /api/customers/:id
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const body = await req.json();

    // Handle manual balance adjustment
    if (body.adjustAmount && body.adjustType) {
      const { adjustAmount, adjustType, note, date, paymentMethod } = body;
      const amount = Number(adjustAmount);
      
      const customer = await Customer.findById(id);
      if (!customer) return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });

      if (!customer.balanceHistory) customer.balanceHistory = [];
      
      const prevCredit = customer.creditBalance || 0;
      customer.creditBalance = adjustType === "add" ? prevCredit + amount : prevCredit - amount;
      
      customer.balanceHistory.push({
        date: date ? new Date(date) : new Date(),
        amount: amount,
        type: adjustType === "subtract" ? "payment" : "adjustment", 
        paymentMethod: paymentMethod || "credit",
        note: note || "Manual Entry"
      });

      customer.updatedBy = session.user.id as any;
      await customer.save();
      return NextResponse.json({ success: true, data: customer });
    }

    const { creditBalance, balanceHistory: _bh, openingBalance, ...updates } = body;
    
    const customer = await Customer.findById(id);
    if (!customer) return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });

    // 1. Handle Opening Balance Correction
    if (openingBalance !== undefined && openingBalance !== customer.openingBalance) {
      const diff = openingBalance - (customer.openingBalance || 0);
      customer.openingBalance = openingBalance;
      customer.creditBalance = (customer.creditBalance || 0) + diff;
      
      if (!customer.balanceHistory) customer.balanceHistory = [];
      customer.balanceHistory.push({
        date: new Date(),
        amount: Math.abs(diff),
        type: diff > 0 ? "adjustment" : "payment",
        paymentMethod: "credit",
        note: "Opening Balance Correction"
      });
    }

    // 2. Handle Current Balance Update (if specifically provided)
    if (creditBalance !== undefined && creditBalance !== customer.creditBalance) {
      const diff = Number(creditBalance) - (customer.creditBalance || 0);
      customer.creditBalance = Number(creditBalance);
      
      if (!customer.balanceHistory) customer.balanceHistory = [];
      customer.balanceHistory.push({
        date: new Date(),
        amount: Math.abs(diff),
        type: diff > 0 ? "adjustment" : "payment",
        paymentMethod: "credit",
        note: "Balance Update (Edit Profile)"
      });
    }

    Object.assign(customer, updates);
    customer.updatedBy = session.user.id as any;
    await customer.save();

    return NextResponse.json({ success: true, data: customer });
  } catch (err: unknown) {
    console.error("[PUT /api/customers/:id]", err);
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// DELETE /api/customers/:id
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const customer = await Customer.findByIdAndDelete(id);
    if (!customer) return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });

    return NextResponse.json({ success: true, message: "Customer deleted" });
  } catch (err) {
    console.error("[DELETE /api/customers/:id]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}