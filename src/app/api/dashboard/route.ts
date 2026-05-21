import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Sale from "@/models/Sale";
import Purchase from "@/models/Purchase";
import Expense from "@/models/Expense";
import SalesReturn from "@/models/SalesReturn";
import Customer from "@/models/Customer";
import Item from "@/models/Item";
import Supplier from "@/models/Supplier";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/dashboard
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
    const startDateParam = searchParams.get("startDate");
    const endDateParam   = searchParams.get("endDate");

    let matchRange: any = {
      date: {
        $gte: new Date(year, 0, 1),
        $lte: new Date(year, 11, 31, 23, 59, 59),
      },
    };

    if (startDateParam && endDateParam) {
      matchRange = {
        date: {
          $gte: new Date(startDateParam),
          $lte: new Date(endDateParam),
        },
      };
    }

    const yearStart = new Date(year, 0, 1);
    const yearEnd   = new Date(year, 11, 31, 23, 59, 59);

    // ── KPI totals ──────────────────────────────────
    const [
      salesAgg,
      returnsAgg,
      purchasesAgg,
      expensesAgg,
      totalCustomers,
      totalItems,
      totalStockAgg,
      totalSuppliers,
      receivableAgg,
      payableAgg,
    ] = await Promise.all([
      Sale.aggregate([
        { $match: matchRange },
        { $group: { _id: "$paymentType", total: { $sum: "$total" } } },
      ]),
      SalesReturn.aggregate([
        { $match: matchRange },
        {
          $lookup: {
            from: "sales",
            localField: "saleId",
            foreignField: "_id",
            as: "saleInfo"
          }
        },
        { $unwind: { path: "$saleInfo", preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: "$saleInfo.paymentType",
            total: { $sum: "$totalAmount" }
          }
        }
      ]),
      Purchase.aggregate([
        { $match: matchRange },
        { $group: { _id: "$paymentType", total: { $sum: "$total" } } },
      ]),
      Expense.aggregate([
        { $match: matchRange },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Customer.countDocuments(),
      Item.countDocuments(),
      Item.aggregate([
        { $group: { _id: null, total: { $sum: "$quantity" } } }
      ]),
      Supplier.countDocuments(),
      Customer.aggregate([
        { $group: { _id: null, total: { $sum: "$creditBalance" } } }
      ]),
      Supplier.aggregate([
        { $group: { _id: null, total: { $sum: "$creditBalance" } } }
      ]),
    ]);

    const stockSum = totalStockAgg[0]?.total ?? 0;

    const returnsByPayment = returnsAgg.reduce((acc: any, curr: any) => {
      const pType = curr._id || "credit";
      acc[pType] = (acc[pType] || 0) + curr.total;
      return acc;
    }, {});
    const totalReturns = returnsAgg.reduce((sum: number, curr: any) => sum + curr.total, 0);
    
    // Aggregate by payment type
    const salesByPayment = salesAgg.reduce((acc: any, curr: any) => {
      acc[curr._id] = curr.total;
      return acc;
    }, {});
    
    const cashSales = Math.max(0, (salesByPayment["cash"] || 0) - (returnsByPayment["cash"] || 0));
    const bankSales = Math.max(0, (salesByPayment["bank"] || 0) - (returnsByPayment["bank"] || 0));
    const creditSales = Math.max(0, (salesByPayment["credit"] || 0) - (returnsByPayment["credit"] || 0));
    const totalSales = cashSales + bankSales + creditSales;
    
    const purchasesByPayment = purchasesAgg.reduce((acc: any, curr: any) => {
      acc[curr._id] = curr.total;
      return acc;
    }, {});
    const totalPurchases = Object.values(purchasesByPayment).reduce((sum: any, val: any) => sum + val, 0) as number;
    const cashPurchases = purchasesByPayment["cash"] || 0;
    const bankPurchases = purchasesByPayment["bank"] || 0;
    const creditPurchases = purchasesByPayment["credit"] || 0;
    const totalExpenses  = expensesAgg[0]?.total ?? 0;
    const totalRevenue   = totalSales - totalPurchases - totalExpenses;
    const totalReceivable = receivableAgg[0]?.total ?? 0;
    const totalPayable    = payableAgg[0]?.total ?? 0;

    // ── Monthly chart data ───────────────────────────
    const [monthlySales, monthlyReturns, monthlyPurchases, monthlyExpenses] = await Promise.all([
      Sale.aggregate([
        { $match: { date: { $gte: yearStart, $lte: yearEnd } } },
        { $group: {
          _id: { month: { $month: "$date" } },
          total: { $sum: "$total" },
        }},
        { $sort: { "_id.month": 1 } },
      ]),
      SalesReturn.aggregate([
        { $match: { date: { $gte: yearStart, $lte: yearEnd } } },
        { $group: {
          _id: { month: { $month: "$date" } },
          total: { $sum: "$totalAmount" },
        }},
        { $sort: { "_id.month": 1 } },
      ]),
      Purchase.aggregate([
        { $match: { date: { $gte: yearStart, $lte: yearEnd } } },
        { $group: {
          _id: { month: { $month: "$date" } },
          total: { $sum: "$total" },
        }},
        { $sort: { "_id.month": 1 } },
      ]),
      Expense.aggregate([
        { $match: { date: { $gte: yearStart, $lte: yearEnd } } },
        { $group: {
          _id: { month: { $month: "$date" } },
          total: { $sum: "$amount" },
        }},
        { $sort: { "_id.month": 1 } },
      ]),
    ]);

    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const chartData = months.map((month, i) => {
      const m      = i + 1;
      const rawS   = monthlySales.find(s => s._id.month === m)?.total ?? 0;
      const retS   = monthlyReturns.find(r => r._id.month === m)?.total ?? 0;
      const sales  = rawS - retS;
      const purch  = monthlyPurchases.find(p => p._id.month === m)?.total ?? 0;
      const expens = monthlyExpenses.find(e => e._id.month === m)?.total ?? 0;
      return { month, sales, purchases: purch, expenses: expens, revenue: sales - purch - expens };
    });

    return NextResponse.json({
      success: true,
      kpi: { totalSales, totalPurchases, totalExpenses, totalRevenue, totalCustomers, totalItems, totalStock: stockSum, totalSuppliers, totalReceivable, totalPayable, cashSales, bankSales, creditSales, cashPurchases, bankPurchases, creditPurchases },
      chartData,
    });
  } catch (err) {
    console.error("[GET /api/dashboard]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}