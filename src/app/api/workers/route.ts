import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Worker from "@/models/Worker";
import Production from "@/models/Production";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const query: any = {};
    if (search.trim()) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { contactNumber: { $regex: search, $options: "i" } },
      ];
    }
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const ed = new Date(endDate);
        ed.setHours(23, 59, 59, 999);
        query.createdAt.$lte = ed;
      }
    }

    const [workers, total] = await Promise.all([
      Worker.find(query).sort({ name: 1 }).skip(skip).limit(limit).lean(),
      Worker.countDocuments(query)
    ]);

    // Fetch work stats for each worker
    const workersWithStats = await Promise.all(
      workers.map(async (w: any) => {
        const workerIdStr = w._id.toString();
        const queryFilter = (statusVal: string) => {
          const filterQuery: any = {
            status: statusVal,
            $or: [
              { workerId: w._id },
              { workerId: workerIdStr }
            ]
          };
          if (startDate || endDate) {
            filterQuery.createdAt = {};
            if (startDate) filterQuery.createdAt.$gte = new Date(startDate);
            if (endDate) {
              const ed = new Date(endDate);
              ed.setHours(23, 59, 59, 999);
              filterQuery.createdAt.$lte = ed;
            }
          }
          return filterQuery;
        };

        const [pendingCount, processingCount, finishedCount] = await Promise.all([
          Production.countDocuments(queryFilter("pending")),
          Production.countDocuments(queryFilter("processing")),
          Production.countDocuments(queryFilter("finished")),
        ]);

        return {
          ...w,
          stats: {
            pending: pendingCount,
            processing: processingCount,
            finished: finishedCount,
            total: pendingCount + processingCount + finishedCount,
          },
        };
      })
    );

    return NextResponse.json({ 
      success: true, 
      data: workersWithStats,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error("[GET /api/workers]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { name, contactNumber } = await req.json();

    const trimmedName = (name || "").trim();
    const trimmedContact = (contactNumber || "").trim();

    if (!trimmedName) {
      return NextResponse.json({ success: false, error: "Worker Name is required" }, { status: 400 });
    }
    if (!trimmedContact) {
      return NextResponse.json({ success: false, error: "Contact Number is required" }, { status: 400 });
    }

    // Check if worker already exists with same name and contact number
    const existing = await Worker.findOne({
      name: { $regex: `^${trimmedName}$`, $options: "i" },
      contactNumber: trimmedContact,
    });
    if (existing) {
      return NextResponse.json({ success: false, error: "Worker already exists with this name and contact number" }, { status: 400 });
    }

    const worker = await Worker.create({
      name: trimmedName,
      contactNumber: trimmedContact,
    });

    return NextResponse.json({ success: true, data: worker });
  } catch (err: any) {
    console.error("[POST /api/workers]", err);
    return NextResponse.json({ success: false, error: err.message || "Server error" }, { status: 500 });
  }
}
