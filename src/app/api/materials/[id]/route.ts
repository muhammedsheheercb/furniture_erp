import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Material from "@/models/Material";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

// PUT /api/materials/:id
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const material = await Material.findByIdAndUpdate(id, body, { new: true, runValidators: true }).lean();
    if (!material) return NextResponse.json({ success: false, error: "Material not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: material });
  } catch (err: unknown) {
    console.error("[PUT /api/materials/:id]", err);
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// DELETE /api/materials/:id
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;

    const material = await Material.findByIdAndDelete(id);
    if (!material) return NextResponse.json({ success: false, error: "Material not found" }, { status: 404 });

    return NextResponse.json({ success: true, message: "Material deleted" });
  } catch (err) {
    console.error("[DELETE /api/materials/:id]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
