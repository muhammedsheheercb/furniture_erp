import { 
  Receipt, 
  Plus, 
  Search, 
  Calendar as CalendarIcon,
  TrendingDown,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { format } from "date-fns";
import CurrencySymbol from "@/components/ui/CurrencySymbol";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function ExpensesPage() {
  const expenses = [
    { date: "24 Apr 2026", category: "Labor", amount: 12000, description: "Weekly wages for assembly team", mode: "Cash" },
    { date: "22 Apr 2026", category: "Electricity", amount: 8500, description: "Factory electricity bill Mar-Apr", mode: "Bank" },
    { date: "20 Apr 2026", category: "Transport", amount: 2500, description: "Delivery diesel for truck", mode: "UPI" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-[#1A1210]">Expense Tracking</h2>
          <p className="text-[#7A6055]">Monitor operational costs and overheads.</p>
        </div>
        <Button className="bg-[#2C1810] hover:bg-[#1A0F0A] text-white">
          <Plus size={18} className="mr-2" /> Record Expense
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-[#E5DDD5]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#7A6055] uppercase">Total This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-rose-600"><CurrencySymbol /> 45,000</div>
            <p className="text-xs text-[#A89080] mt-1 flex items-center gap-1">
              <TrendingDown size={14} className="text-emerald-500" /> 12% less than last month
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-[#E5DDD5]">
          <CardHeader className="p-4 border-b border-[#E5DDD5] flex flex-row items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A89080]" size={18} />
              <Input 
                placeholder="Search expenses..." 
                className="pl-10 border-[#E5DDD5] bg-[#FAF8F6]"
              />
            </div>
            <Button variant="outline" size="sm" className="ml-2 border-[#E5DDD5]">
              <Filter size={16} />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAF8F6] border-b border-[#E5DDD5]">
                    <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase">Date</th>
                    <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase">Category</th>
                    <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase">Description</th>
                    <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EBE5]">
                  {expenses.map((exp, i) => (
                    <tr key={i} className="hover:bg-[#FAF8F6] transition-colors">
                      <td className="py-4 px-6 text-sm text-[#1A1210]">{exp.date}</td>
                      <td className="py-4 px-6">
                        <span className="text-xs font-bold text-[#8B5E3C] bg-[#EDE8E0] px-2 py-0.5 rounded border border-[#E5DDD5]">
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-[#7A6055]">{exp.description}</td>
                      <td className="py-4 px-6 text-sm font-bold text-rose-600"><CurrencySymbol /> {exp.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
