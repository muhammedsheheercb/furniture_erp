import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import DamagedItem from "@/models/DamagedItem";
import Item from "@/models/Item";
import User from "@/models/User";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      DamagedItem.find()
        .populate("createdBy", "name")
        .populate("updatedBy", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      DamagedItem.countDocuments(),
    ]);

    return NextResponse.json({
      data: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch damaged items" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const dbSession = await mongoose.startSession();
  dbSession.startTransaction();

  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const body = await req.json();

    // 1 — Create the damaged record
    const newDamaged = new DamagedItem({
      ...body,
      createdBy: session.user.id,
      updatedBy: session.user.id,
    });
    await newDamaged.save({ session: dbSession });

    // 2 — Decrease inventory manually with FIFO for batches
    const item = await Item.findById(body.itemId).session(dbSession);
    if (!item) throw new Error("Item not found");

    item.quantity = (item.quantity || 0) - body.quantity;

    if (item.batches && item.batches.length > 0) {
      if (body.batch) {
        const batch = item.batches.find(
          (b: any) => b.batchNumber === body.batch,
        );
        if (batch) {
          batch.quantity -= body.quantity;
        } else {
          // Fallback to FIFO
          let remainingToDeduct = body.quantity;
          item.batches.sort(
            (a: any, b: any) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          );
          for (const b of item.batches) {
            if (remainingToDeduct <= 0) break;
            const deduct = Math.min(b.quantity, remainingToDeduct);
            b.quantity -= deduct;
            remainingToDeduct -= deduct;
          }
        }
      } else {
        // FIFO
        let remainingToDeduct = body.quantity;
        item.batches.sort(
          (a: any, b: any) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );

        for (const batch of item.batches) {
          if (remainingToDeduct <= 0) break;
          const deductFromThisBatch = Math.min(
            batch.quantity,
            remainingToDeduct,
          );
          batch.quantity -= deductFromThisBatch;
          remainingToDeduct -= deductFromThisBatch;
        }
      }
    }

    await item.save({ session: dbSession });

    await dbSession.commitTransaction();
    return NextResponse.json(newDamaged, { status: 201 });
  } catch (error: any) {
    await dbSession.abortTransaction();
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    dbSession.endSession();
  }
}
