"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { 
  Hammer, 
  PlayCircle, 
  CheckCircle2,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";

export default function ProductionPage() {
  const [productions, setProductions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProductions = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/production");
      if (res.data.success) {
        setProductions(res.data.data);
      }
    } catch (err) {
      toast.error("Failed to load production orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductions();
  }, []);

  const handleUpdateStatus = async (id: string, currentStatus: string) => {
    const nextStatusMap: Record<string, string> = {
      pending: "processing",
      processing: "finished",
    };
    const nextStatus = nextStatusMap[currentStatus];
    if (!nextStatus) return;

    try {
      const res = await axios.put(`/api/production/${id}`, { status: nextStatus });
      if (res.data.success) {
        toast.success(`Production status updated to ${nextStatus}`);
        fetchProductions();
      }
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const stages = [
    { name: "Pending", icon: Clock, color: "bg-gray-400" },
    { name: "Processing", icon: PlayCircle, color: "bg-amber-500" },
    { name: "Finished", icon: CheckCircle2, color: "bg-emerald-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-[#1A1210]">Production Control</h2>
          <p className="text-[#7A6055]">Monitor manufacturing stages for furniture orders.</p>
        </div>
      </div>

      {/* Production Stages Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stages.map((stage) => (
          <Card key={stage.name} className="border-[#E5DDD5] text-center p-4">
            <div className={`h-10 w-10 ${stage.color} rounded-full mx-auto mb-3 flex items-center justify-center text-white shadow-lg`}>
              <stage.icon size={20} />
            </div>
            <p className="text-xs font-bold text-[#7A6055] uppercase tracking-tighter">{stage.name}</p>
            <p className="text-xl font-bold text-[#1A1210] mt-1">
              {productions.filter(p => p.status === stage.name.toLowerCase()).length}
            </p>
          </Card>
        ))}
      </div>

      <Card className="border-[#E5DDD5]">
        <CardHeader>
          <CardTitle>Active Production Orders</CardTitle>
          <CardDescription>Track the real-time progress of manufactured items.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-[#7A6055]">Loading...</div>
          ) : productions.length === 0 ? (
            <div className="py-10 text-center text-[#7A6055]">No production orders found.</div>
          ) : (
            <div className="space-y-4">
              {productions.map((prod) => (
                <div key={prod._id} className="p-4 rounded-xl border border-[#E5DDD5] hover:border-[#C9A84C] transition-colors group">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded bg-[#FAF8F6] flex items-center justify-center text-[#8B5E3C]">
                        <Hammer size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-[#1A1210] text-lg">{prod.customerName}</h4>
                        <p className="text-sm text-[#A89080]">Sale #: {prod.saleNumber} • {prod.items.length} Items</p>
                        {prod.remarks && <p className="text-xs text-[#8B5E3C] mt-1">Remarks: {prod.remarks}</p>}
                      </div>
                    </div>
                    
                    <div className="flex-1 max-w-md">
                      <div className="space-y-1">
                        {prod.items.map((item: any, i: number) => (
                          <div key={i} className="text-xs text-[#7A6055] flex justify-between">
                            <span>{item.itemName} ({item.color}, {item.material}, {item.size})</span>
                            <span className="font-bold">x{item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs text-[#A89080] uppercase font-bold">Status</p>
                        <Badge variant={prod.status === "finished" ? "success" : prod.status === "processing" ? "warning" : "secondary"}>
                          {prod.status}
                        </Badge>
                      </div>
                      {prod.status !== "finished" && (
                        <Button 
                          onClick={() => handleUpdateStatus(prod._id, prod.status)}
                          className="bg-[#2C1810] hover:bg-[#1A0F0A] text-white"
                        >
                          {prod.status === "pending" ? "Start Work" : "Mark Finished"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
