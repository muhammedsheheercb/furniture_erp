import { 
  Database, 
  Plus, 
  Search, 
  ArrowUpDown,
  AlertTriangle,
  History
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import CurrencySymbol from "@/components/ui/CurrencySymbol";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function MaterialsPage() {
  const materials = [
    { name: "Teak Wood", category: "wood", stock: 150, unit: "sqft", reorder: 50, price: 450 },
    { name: "Velvet Fabric (Blue)", category: "fabric", stock: 25, unit: "meter", reorder: 30, price: 800 },
    { name: "High Density Foam", category: "foam", stock: 12, unit: "piece", reorder: 10, price: 1200 },
    { name: "Stainless Steel Hinges", category: "hardware", stock: 200, unit: "piece", reorder: 100, price: 45 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-[#1A1210]">Raw Materials</h2>
          <p className="text-[#7A6055]">Monitor inventory for manufacturing and assembly.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-[#E5DDD5]">
            <History size={18} className="mr-2" /> Stock Movement
          </Button>
          <Button className="bg-[#2C1810] hover:bg-[#1A0F0A] text-white">
            <Plus size={18} className="mr-2" /> New Material
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Low Stock Alert Widget */}
        <Card className="border-rose-200 bg-rose-50/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-rose-900 uppercase">Low Stock</p>
              <p className="text-2xl font-black text-rose-700">03 Items</p>
            </div>
          </CardContent>
        </Card>
        
        {/* Total Valuation */}
        <Card className="border-[#E5DDD5]">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-[#FAF8F6] flex items-center justify-center text-[#C9A84C]">
              <Database size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-[#7A6055] uppercase">Inventory Value</p>
              <p className="text-2xl font-black text-[#1A1210]"><CurrencySymbol /> 2.4L</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-[#E5DDD5]">
        <CardHeader className="p-4 border-b border-[#E5DDD5]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A89080]" size={18} />
            <Input 
              placeholder="Search materials..." 
              className="pl-10 border-[#E5DDD5] bg-[#FAF8F6]"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAF8F6] border-b border-[#E5DDD5]">
                  <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase tracking-wider">Material Name</th>
                  <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase tracking-wider">Category</th>
                  <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase tracking-wider">Current Stock</th>
                  <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase tracking-wider">Last Price</th>
                  <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EBE5]">
                {materials.map((mat, i) => (
                  <tr key={i} className="hover:bg-[#FAF8F6] transition-colors">
                    <td className="py-4 px-6 font-semibold text-[#1A1210]">{mat.name}</td>
                    <td className="py-4 px-6">
                      <Badge variant="default" className="text-[10px] uppercase font-bold text-[#7A6055] border-[#E5DDD5]">
                        {mat.category}
                      </Badge>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${mat.stock <= mat.reorder ? 'text-rose-600' : 'text-[#1A1210]'}`}>
                          {mat.stock} {mat.unit}
                        </span>
                        {mat.stock <= mat.reorder && <AlertTriangle size={14} className="text-rose-500" />}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-[#7A6055]"><CurrencySymbol /> {mat.price}/{mat.unit}</td>
                    <td className="py-4 px-6 text-right">
                      <Button variant="ghost" size="sm" className="text-[#C9A84C]">Edit</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
