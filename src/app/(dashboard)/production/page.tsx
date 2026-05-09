"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Hammer,
  PlayCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import ProductionModal from "@/components/production/ProductionModal";
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
  const [selectedProd, setSelectedProd] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchProductions = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/production");
      if (res.data.success) setProductions(res.data.data);
    } catch {
      toast.error("Failed to load production orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProductions(); }, []);

  const handleUpdateStatus = async (id: string, currentStatus: string) => {
    if (currentStatus === "pending") {
      const prod = productions.find(p => p._id === id);
      setSelectedProd(prod);
      setModalOpen(true);
      return;
    }
    try {
      const res = await axios.put(`/api/production/${id}`, { status: "finished" });
      if (res.data.success) {
        toast.success("Marked as finished");
        fetchProductions();
      }
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleStartProduction = async (id: string, data: any) => {
    setUpdating(true);
    try {
      const res = await axios.put(`/api/production/${id}`, {
        status: "processing",
        remarks: data.remarks,
        deliveryDate: data.deliveryDate,
      });
      if (res.data.success) {
        toast.success("Production started");
        setModalOpen(false);
        fetchProductions();
      }
    } catch {
      toast.error("Failed to start production");
    } finally {
      setUpdating(false);
    }
  };

  const inProgress = productions.filter(p => p.status === "pending" || p.status === "processing");
  const finished   = productions.filter(p => p.status === "finished");

  const stages = [
    { name: "Pending",    icon: Clock,        color: "bg-gray-400",    key: "pending" },
    { name: "Processing", icon: PlayCircle,   color: "bg-amber-500",   key: "processing" },
    { name: "Finished",   icon: CheckCircle2, color: "bg-emerald-500", key: "finished" },
  ];

  function ProductionCard({ prod }: { prod: any }) {
    return (
      <div className="p-4 rounded-xl border border-[#E5DDD5] hover:border-[#C9A84C] transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded bg-[#FAF8F6] flex items-center justify-center text-[#8B5E3C] shrink-0">
              <Hammer size={24} />
            </div>
            <div>
              <h4 className="font-bold text-[#1A1210] text-lg">{prod.customerName}</h4>
              <p className="text-sm text-[#A89080]">Sale #: {prod.saleNumber} · {prod.items.length} item{prod.items.length !== 1 ? "s" : ""}</p>
              {prod.remarks && <p className="text-xs text-[#8B5E3C] mt-0.5">Remarks: {prod.remarks}</p>}
            </div>
          </div>

          <div className="flex-1 max-w-sm">
            <div className="space-y-1">
              {prod.items.map((item: any, i: number) => (
                <div key={i} className="text-xs text-[#7A6055] flex justify-between">
                  <span>{item.itemName}{item.color ? ` · ${item.color}` : ""}</span>
                  <span className="font-bold ml-2">x{item.quantity}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right">
              <p className="text-xs text-[#A89080] uppercase font-bold">Status</p>
              <Badge variant={
                prod.status === "finished"   ? "success" :
                prod.status === "processing" ? "warning" : "default"
              }>
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
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-extrabold text-[#1A1210]">Production Control</h2>
        <p className="text-[#7A6055]">Monitor manufacturing stages for furniture orders.</p>
      </div>

      {/* Stage counters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stages.map(stage => (
          <Card key={stage.name} className="border-[#E5DDD5] text-center p-4">
            <div className={`h-10 w-10 ${stage.color} rounded-full mx-auto mb-3 flex items-center justify-center text-white shadow-lg`}>
              <stage.icon size={20} />
            </div>
            <p className="text-xs font-bold text-[#7A6055] uppercase tracking-tighter">{stage.name}</p>
            <p className="text-xl font-bold text-[#1A1210] mt-1">
              {productions.filter(p => p.status === stage.key).length}
            </p>
          </Card>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C9A84C]"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* ── In Progress ──────────────────────────────────── */}
          <Card className="border-[#E5DDD5]">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-amber-500"></div>
                <CardTitle className="text-lg">Start Work / In Progress</CardTitle>
                <span className="ml-1 text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  {inProgress.length}
                </span>
              </div>
              <CardDescription>Orders waiting to start or currently being manufactured.</CardDescription>
            </CardHeader>
            <CardContent>
              {inProgress.length === 0 ? (
                <div className="py-8 text-center text-[#A89080] text-sm">No pending or in-progress orders.</div>
              ) : (
                <div className="space-y-4">
                  {inProgress.map(prod => <ProductionCard key={prod._id} prod={prod} />)}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Finished ─────────────────────────────────────── */}
          <Card className="border-[#E5DDD5]">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-emerald-500"></div>
                <CardTitle className="text-lg">Finished</CardTitle>
                <span className="ml-1 text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {finished.length}
                </span>
              </div>
              <CardDescription>Completed production orders ready for delivery.</CardDescription>
            </CardHeader>
            <CardContent>
              {finished.length === 0 ? (
                <div className="py-8 text-center text-[#A89080] text-sm">No finished orders yet.</div>
              ) : (
                <div className="space-y-4">
                  {finished.map(prod => <ProductionCard key={prod._id} prod={prod} />)}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <ProductionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleStartProduction}
        production={selectedProd}
        loading={updating}
      />
    </div>
  );
}
