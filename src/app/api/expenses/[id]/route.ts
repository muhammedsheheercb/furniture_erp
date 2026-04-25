import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Expense from "@/models/Expense";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
    try {
        await connectDB();
        const { id } = await params;
        const expense = await Expense.findById(id);
        if (!expense) return NextResponse.json({ success: false, error: "Expense not found" }, { status: 404 });
        return NextResponse.json({ success: true, data: expense });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: Params) {
    try {
        await connectDB();
        const body = await req.json();
        const { id } = await params;
        const expense = await Expense.findByIdAndUpdate(id, body, { new: true });
        if (!expense) return NextResponse.json({ success: false, error: "Expense not found" }, { status: 404 });
        return NextResponse.json({ success: true, data: expense });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: Params) {
    try {
        await connectDB();
        const { id } = await params;
        const expense = await Expense.findByIdAndDelete(id);
        if (!expense) return NextResponse.json({ success: false, error: "Expense not found" }, { status: 404 });
        return NextResponse.json({ success: true, message: "Expense deleted" });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
