import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import SaleRaw from "@/models/Sale";
const Sale = SaleRaw as any;
import ItemRaw from "@/models/Item";
const Item = ItemRaw as any;
import MaterialRaw from "@/models/Material";
const Material = MaterialRaw as any;
import CustomerRaw from "@/models/Customer";
const Customer = CustomerRaw as any;
import ProductionRaw from "@/models/Production";
const Production = ProductionRaw as any;
import User from "@/models/User";
import { generateUniqueNumber } from "../../../lib/utils";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import mongoose from "mongoose";
import Delivery from "@/models/Delivery";
import Quotation from "@/models/Quotation";

// GET /api/sales
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    if (!(await hasPermission("sales", "view")))
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );

    await connectDB();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const paymentType = searchParams.get("paymentType");
    const status = searchParams.get("status");
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = {};

    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: "i" } },
        { saleNumber: { $regex: search, $options: "i" } },
      ];
    }
    if (paymentType) query.paymentType = paymentType;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    } else if (month && year) {
      const m = parseInt(month),
        y = parseInt(year);
      query.date = {
        $gte: new Date(y, m - 1, 1),
        $lte: new Date(y, m, 0, 23, 59, 59),
      };
    } else if (year) {
      const y = parseInt(year);
      query.date = {
        $gte: new Date(y, 0, 1),
        $lte: new Date(y, 11, 31, 23, 59, 59),
      };
    }

    const [sales, total, totalAmountResult] = await Promise.all([
      Sale.find(query)
        .populate("createdBy", "name")
        .populate("updatedBy", "name")
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      Sale.countDocuments(query),
      Sale.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
    ]);

    const totalAmount = totalAmountResult[0]?.total ?? 0;

    // Fetch production and delivery statuses for these sales
    const saleIds = sales.map((s: any) => s._id);
    const [productions, deliveries] = await Promise.all([
      Production.find({ saleId: { $in: saleIds } }).lean(),
      Delivery.find({ saleId: { $in: saleIds } }).lean(),
    ]);

    const prodMap = productions.reduce((acc: any, p: any) => {
      acc[p.saleId.toString()] = p.status;
      return acc;
    }, {});

    const delMap = deliveries.reduce((acc: any, d: any) => {
      acc[d.saleId.toString()] = d.status;
      return acc;
    }, {});

    const salesWithStatuses = sales.map((s: any) => ({
      ...s,
      productionStatus: prodMap[s._id.toString()] || "pending",
      deliveryStatus: delMap[s._id.toString()] || "pending",
    }));

    return NextResponse.json({
      success: true,
      data: salesWithStatuses,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      totalAmount,
    });
  } catch (err) {
    console.error("[GET /api/sales]", err);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 },
    );
  }
}

// POST /api/sales
export async function POST(req: NextRequest) {
  const dbSession = await mongoose.startSession();
  dbSession.startTransaction();
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );

    await connectDB();
    const body = await req.json();
    const lastSale = await Sale.findOne({
      saleNumber: { $regex: /^(sale-|SALE-)\d{3,6}$/ },
    })
      .sort({ createdAt: -1 })
      .session(dbSession);

    let nextNum = 100;
    if (lastSale && lastSale.saleNumber) {
      const lastNumString = lastSale.saleNumber
        .replace("sale-", "")
        .replace("SALE-", "");
      const lastNum = parseInt(lastNumString);
      if (!isNaN(lastNum)) {
        nextNum = lastNum + 1;
      }
    }
    const saleNumber = `sale-${nextNum.toString().padStart(3, "0")}`;

    // 1 — create sale
    const [sale] = await Sale.create(
      [
        {
          ...body,
          saleNumber,
          createdBy: session.user.id,
          updatedBy: session.user.id,
        },
      ],
      { session: dbSession },
    );

    // 2 — Split items into manufactured and direct-buy, and decrease stock for direct-buy
    const directBuyItems: any[] = [];
    const manufacturedItems: any[] = [];
    
    for (const saleItem of body.items) {
      if (!saleItem.itemId) {
        // Custom items not in DB, assume direct buy so it skips production unless it's a conversion?
        // Let's assume manufactured if it's a quotation conversion, to be safe, or direct buy.
        if (body.isDirect) {
          directBuyItems.push(saleItem);
        } else {
          manufacturedItems.push(saleItem);
        }
        continue;
      }
      
      const item = await Item.findById(saleItem.itemId).session(dbSession);
      if (!item) {
        if (body.isDirect) directBuyItems.push(saleItem);
        else manufacturedItems.push(saleItem);
        continue;
      }
      
      // If it's a direct sale (not from quotation), everything acts as direct buy (already in stock).
      // Otherwise, if it's from quotation and isManufactured is true, it goes to production.
      if (!body.isDirect && item.isManufactured) {
        manufacturedItems.push(saleItem);
        continue; // Do NOT deduct stock here. Stock will be added when production finishes.
      }
      
      // Otherwise, it's a direct buy item (or a direct sale of a manufactured item already in stock)
      directBuyItems.push(saleItem);

      if ((item.quantity || 0) < saleItem.quantity) {
        throw new Error(
          `Insufficient stock for item: ${saleItem.itemName} (Available: ${item.quantity || 0}, Requested: ${saleItem.quantity})`,
        );
      }

      // Update total quantity
      item.quantity = (item.quantity || 0) - saleItem.quantity;

      // Update batches (Manual Selection if provided, else FIFO)
      if (item.batches && item.batches.length > 0) {
        if (saleItem.batch) {
          const batch = item.batches.find((b: any) => b.batchNumber === saleItem.batch);
          if (batch) {
            batch.quantity -= saleItem.quantity;
          } else {
            let remainingToDeduct = saleItem.quantity;
            item.batches.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            for (const b of item.batches) {
              if (remainingToDeduct <= 0) break;
              const deductFromThisBatch = Math.min(b.quantity, remainingToDeduct);
              b.quantity -= deductFromThisBatch;
              remainingToDeduct -= deductFromThisBatch;
            }
          }
        } else {
          let remainingToDeduct = saleItem.quantity;
          item.batches.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          for (const batch of item.batches) {
            if (remainingToDeduct <= 0) break;
            const deductFromThisBatch = Math.min(batch.quantity, remainingToDeduct);
            batch.quantity -= deductFromThisBatch;
            remainingToDeduct -= deductFromThisBatch;
          }
        }
      }

      await item.save({ session: dbSession });
    }

    // 3 — update customer outstanding for any sale that has an unpaid balance
    const outstandingAmount = Number(body.total) - Number(body.advancePaid || 0);
    if (outstandingAmount > 0) {
      const customer = await Customer.findById(body.customerId).session(dbSession);
      if (customer) {
        if (!customer.balanceHistory) customer.balanceHistory = [];
        customer.creditBalance = (customer.creditBalance || 0) + outstandingAmount;
        customer.balanceHistory.push({
          date: new Date(),
          amount: outstandingAmount,
          type: "adjustment",
          paymentMethod: body.paymentType,
          note: `Sale Entry — ${saleNumber}`,
        });
        await customer.save({ session: dbSession });
      }
    }
    
    // Note: We no longer reserve materials here (3.5). Materials are deducted when Production starts in PUT /api/production/[id]

    // 4 — create production entry for manufactured items
    if (manufacturedItems.length > 0) {
      await Production.create(
        [
          {
            saleId: sale._id,
            saleNumber: sale.saleNumber,
            customerId: sale.customerId,
            customerName: sale.customerName,
            items: manufacturedItems.map((it: any) => ({
              itemName: it.itemName,
              quantity: it.quantity,
              color: it.color,
              material: it.material,
              size: it.size,
              dimensions: it.dimensions,
              bom: it.bom,
              pricing: it.pricing,
              variants: it.variants,
              status: "pending", // manufactured items always start as pending
            })),
            status: "pending",
            remarks: body.remarks || "",
            deliveryDate: body.deliveryDate ? new Date(body.deliveryDate) : undefined,
          },
        ],
        { session: dbSession },
      );
    }

    // 5 — create a delivery entry for direct buy items immediately
    if (directBuyItems.length > 0) {
      await Delivery.create(
        [
          {
            saleId: sale._id,
            saleNumber: sale.saleNumber,
            customerId: sale.customerId,
            customerName: sale.customerName,
            items: directBuyItems.map((it: any) => ({
              itemName: it.itemName,
              quantity: it.quantity,
              status: "pending",
            })),
            status: "pending",
            deliveryDate: body.deliveryDate ? new Date(body.deliveryDate) : undefined,
            deliveryAddress: body.deliveryAddress || "",
            remarks: body.remarks || "",
          },
        ],
        { session: dbSession },
      );
    }

    // 7 — if converted from quotation, update quotation
    if (body.quotationId) {
      await Quotation.findByIdAndUpdate(body.quotationId, {
        status: "sale",
        convertedToSaleId: sale._id,
      }).session(dbSession);
    }

    await dbSession.commitTransaction();
    return NextResponse.json({ success: true, data: sale }, { status: 201 });
  } catch (err: unknown) {
    await dbSession.abortTransaction();
    console.error("[POST /api/sales]", err);
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  } finally {
    dbSession.endSession();
  }
}
