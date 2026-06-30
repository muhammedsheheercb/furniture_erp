import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const { searchParams } = new URL(req.url);
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        const query: any = { role: { $ne: "admin" } };
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) {
                const ed = new Date(endDate);
                ed.setHours(23, 59, 59, 999);
                query.createdAt.$lte = ed;
            }
        }

        const users = await User.find(query).select("-password");
        return NextResponse.json({ success: true, data: users });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { name, email, password, permissions, role } = body;

        await connectDB();
        const exists = await User.findOne({ name });
        if (exists) {
            return NextResponse.json({ success: false, error: "User with this name already exists" }, { status: 400 });
        }

        const user = await User.create({
            name,
            email,
            password,
            role: role || "staff",
            permissions,
        });

        const { password: _, ...userWithoutPassword } = user.toObject();
        return NextResponse.json({ success: true, data: userWithoutPassword });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
