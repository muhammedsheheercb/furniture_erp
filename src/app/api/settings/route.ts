import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Setting from "@/models/Setting";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();
    
    let setting = await Setting.findOne();
    if (!setting) {
      // Create default settings if none exist
      setting = await Setting.create({});
    }

    return NextResponse.json({ success: true, data: setting });
  } catch (err) {
    console.error("[GET /api/settings]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

// POST /api/settings (Update settings)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const body = await req.json();
    
    let setting = await Setting.findOne();
    if (!setting) {
      setting = new Setting(body);
    } else {
      Object.assign(setting, body);
    }
    
    await setting.save();

    return NextResponse.json({ success: true, data: setting });
  } catch (err) {
    console.error("[POST /api/settings]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
