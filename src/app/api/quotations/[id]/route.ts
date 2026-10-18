import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Quotation from "@/models/Quotation";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    await connectDB();
    const { id } = await params;
    const quotation = await Quotation.findById(id)
      .populate("createdBy", "name")
      .lean();
    if (!quotation)
      return NextResponse.json(
        { success: false, error: "Not found" },
        { status: 404 },
      );
    return NextResponse.json({ success: true, data: quotation });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    // The edit form can include empty strings for optional ObjectId fields.
    // Mongoose cannot cast "" to an ObjectId, so normalize those values to
    // null (which clears the optional reference) before updating.
    if (body.customerId === "") body.customerId = null;
    if (Array.isArray(body.items)) {
      body.items = body.items.map((item: any) => {
        if (item?.itemId === "") item.itemId = null;
        if (Array.isArray(item?.bom)) {
          item.bom = item.bom.map((entry: any) =>
            entry?.materialId === "" ? { ...entry, materialId: null } : entry,
          );
        }
        return item;
      });
    }

    const updated = await Quotation.findByIdAndUpdate(
      id,
      { ...body, updatedBy: (session.user as any)?.id },
      { new: true, runValidators: true },
    ).lean();

    if (!updated)
      return NextResponse.json(
        { success: false, error: "Not found" },
        { status: 404 },
      );
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    await connectDB();
    const { id } = await params;
    const deleted = await Quotation.findByIdAndDelete(id);
    if (!deleted)
      return NextResponse.json(
        { success: false, error: "Not found" },
        { status: 404 },
      );
    return NextResponse.json({ success: true, message: "Quotation deleted" });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
