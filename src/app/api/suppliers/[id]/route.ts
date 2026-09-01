import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Supplier from "@/models/Supplier";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

// GET /api/suppliers/:id
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );

    await connectDB();
    const { id } = await params;
    const supplier = await Supplier.findById(id)
      .populate("itemsProvided")
      .populate("createdBy", "name")
      .populate("updatedBy", "name")
      .lean();
    if (!supplier)
      return NextResponse.json(
        { success: false, error: "Supplier not found" },
        { status: 404 },
      );

    const history = supplier.balanceHistory || [];
    const credit = supplier.creditBalance || 0;

    // AUTO-POPULATE FIX: If history is empty but there's a balance, return it as the first entry!
    if (history.length === 0 && credit !== 0) {
      history.push({
        date: supplier.createdAt || new Date(),
        amount: Math.abs(credit),
        type: credit > 0 ? "adjustment" : "payment",
        note: "Initial Opening Balance",
        paymentMethod: undefined,
      } as any);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...supplier,
        balanceHistory: history,
      },
    });
  } catch (err) {
    console.error("[GET /api/suppliers/:id]", err);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 },
    );
  }
}

// PUT /api/suppliers/:id
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
    const body = await req.json();

    // Handle manual balance adjustment
    if (body.adjustAmount && body.adjustType) {
      const { adjustAmount, adjustType, note, date, paymentMethod } = body;
      const amount = Number(adjustAmount);

      const supplier = await Supplier.findById(id);
      if (!supplier)
        return NextResponse.json(
          { success: false, error: "Supplier not found" },
          { status: 404 },
        );

      // Initialize balanceHistory if it doesn't exist
      if (!supplier.balanceHistory) supplier.balanceHistory = [];

      const prevOpening = supplier.openingBalance || 0;
      const prevCredit = supplier.creditBalance || 0;

      const newCredit =
        adjustType === "add" ? prevCredit + amount : prevCredit - amount;

      supplier.creditBalance = newCredit;

      if (!supplier.balanceHistory) supplier.balanceHistory = [];
      supplier.balanceHistory.push({
        date: date ? new Date(date) : new Date(),
        amount: amount,
        type: adjustType === "subtract" ? "payment" : "adjustment",
        paymentMethod: paymentMethod || "cash",
        note: note || "Manual adjustment",
      });

      supplier.updatedBy = session.user.id as any;
      await supplier.save();
      return NextResponse.json({ success: true, data: supplier });
    }

    const {
      balanceHistory: _bh,
      openingBalance,
      creditBalance,
      ...updates
    } = body;

    const supplier = await Supplier.findById(id);
    if (!supplier)
      return NextResponse.json(
        { success: false, error: "Supplier not found" },
        { status: 404 },
      );

    if (
      openingBalance !== undefined &&
      openingBalance !== supplier.openingBalance
    ) {
      const diff = openingBalance - (supplier.openingBalance || 0);
      supplier.openingBalance = openingBalance;
      supplier.creditBalance = (supplier.creditBalance || 0) + diff;

      if (!supplier.balanceHistory) supplier.balanceHistory = [];
      supplier.balanceHistory.push({
        date: new Date(),
        amount: Math.abs(diff),
        type: diff > 0 ? "adjustment" : "payment",
        paymentMethod: "cash",
        note: "Opening Balance Correction",
      });
    }

    // Handle Current Balance Update (if specifically provided)
    if (
      creditBalance !== undefined &&
      creditBalance !== supplier.creditBalance
    ) {
      const diff = Number(creditBalance) - (supplier.creditBalance || 0);
      supplier.creditBalance = Number(creditBalance);

      if (!supplier.balanceHistory) supplier.balanceHistory = [];
      supplier.balanceHistory.push({
        date: new Date(),
        amount: Math.abs(diff),
        type: diff > 0 ? "adjustment" : "payment",
        paymentMethod: "cash",
        note: "Balance Update (Edit Profile)",
      });
    }

    Object.assign(supplier, updates);
    supplier.updatedBy = session.user.id as any;
    await supplier.save();

    return NextResponse.json({ success: true, data: supplier });
  } catch (err: unknown) {
    console.error("[PUT /api/suppliers/:id]", err);
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// DELETE /api/suppliers/:id
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );

    await connectDB();
    const { id } = await params;
    const supplier = await Supplier.findByIdAndDelete(id);
    if (!supplier)
      return NextResponse.json(
        { success: false, error: "Supplier not found" },
        { status: 404 },
      );

    return NextResponse.json({ success: true, message: "Supplier deleted" });
  } catch (err) {
    console.error("[DELETE /api/suppliers/:id]", err);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 },
    );
  }
}
