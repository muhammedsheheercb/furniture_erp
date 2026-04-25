import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import DamagedItem from "@/models/DamagedItem";
import Item from "@/models/Item";
import User from "@/models/User";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(
    req: Request,
    { params }: Params
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await connectDB();
        const { id } = await params;
        const item = await DamagedItem.findById(id)
            .populate("createdBy", "name")
            .populate("updatedBy", "name");
        if (!item) return NextResponse.json({ error: "Damaged item not found" }, { status: 404 });
        return NextResponse.json(item);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(
    req: Request,
    { params }: Params
) {
    const dbSession = await mongoose.startSession();
    dbSession.startTransaction();

    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await connectDB();
        const { id } = await params;
        const body = await req.json();
        const oldDamaged = await DamagedItem.findById(id).session(dbSession);

        if (!oldDamaged) {
            return NextResponse.json({ error: "Damaged item record not found" }, { status: 404 });
        }

        const quantityDiff = body.quantity - oldDamaged.quantity;
        
        // 1 - Update record
        const updated = await DamagedItem.findByIdAndUpdate(id, {
            ...body,
            updatedBy: session.user.id
        }, { 
            new: true,
            session: dbSession 
        });

        // 2 - Adjust inventory if quantity changed or if item changed!
        if (oldDamaged.itemId === body.itemId) {
            if (quantityDiff !== 0) {
                await Item.findByIdAndUpdate(
                    body.itemId,
                    { $inc: { quantity: -quantityDiff } },
                    { session: dbSession }
                );
            }
        } else {
            // Revert old item
            await Item.findByIdAndUpdate(
                oldDamaged.itemId,
                { $inc: { quantity: oldDamaged.quantity } },
                { session: dbSession }
            );
            // Decrease from new item
            await Item.findByIdAndUpdate(
                body.itemId,
                { $inc: { quantity: -body.quantity } },
                { session: dbSession }
            );
        }

        await dbSession.commitTransaction();
        return NextResponse.json(updated);
    } catch (error: any) {
        await dbSession.abortTransaction();
        return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
        dbSession.endSession();
    }
}

export async function DELETE(
    req: Request,
    { params }: Params
) {
    const dbSession = await mongoose.startSession();
    dbSession.startTransaction();

    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await connectDB();
        const { id } = await params;
        const damaged = await DamagedItem.findById(id).session(dbSession);
        if (!damaged) {
            return NextResponse.json({ error: "Damaged record not found" }, { status: 404 });
        }

        // 1 - Restore quantity
        await Item.findByIdAndUpdate(
            damaged.itemId,
            { $inc: { quantity: damaged.quantity } },
            { session: dbSession }
        );

        // 2 - Delete record
        await DamagedItem.findByIdAndDelete(id).session(dbSession);

        await dbSession.commitTransaction();
        return NextResponse.json({ message: "Damaged record deleted" });
    } catch (error: any) {
        await dbSession.abortTransaction();
        return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
        dbSession.endSession();
    }
}
