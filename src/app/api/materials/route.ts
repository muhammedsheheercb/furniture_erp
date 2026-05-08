import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Material from "@/models/Material";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const CATEGORY_PREFIX: Record<string, string> = {
  plywood:  "PLY",
  wood:     "WOD",
  fabric:   "FAB",
  foam:     "FOM",
  hardware: "HWD",
  polish:   "POL",
  other:    "MAT",
};

async function generateCode(category: string): Promise<string> {
  const prefix = CATEGORY_PREFIX[category] || "MAT";
  // Count how many materials already have this prefix
  const count = await Material.countDocuments({ code: { $regex: `^${prefix}-` } });
  return `${prefix}-${String(count + 1).padStart(3, "0")}`;
}

// GET /api/materials
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    const query = search
      ? {
          $or: [
            { name:     { $regex: search, $options: "i" } },
            { code:     { $regex: search, $options: "i" } },
            { category: { $regex: search, $options: "i" } },
            { brand:    { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const materials = await Material.find(query).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: materials });
  } catch (err) {
    console.error("[GET /api/materials]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

// POST /api/materials
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const body = await req.json();

    // Always auto-generate code — ignore any client-supplied code
    const code = await generateCode(body.category || "other");
    const material = await Material.create({ ...body, code });

    return NextResponse.json({ success: true, data: material }, { status: 201 });
  } catch (err: unknown) {
    console.error("[POST /api/materials]", err);
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
