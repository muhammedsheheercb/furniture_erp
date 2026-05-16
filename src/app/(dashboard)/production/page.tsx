"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
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
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const perms = (session?.user?.permissions as any)?.production;
  const canEdit = isAdmin || perms?.edit;

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
        items: data.items,
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

  const [activeTab, setActiveTab] = useState<"pending" | "processing" | "finished">("pending");

  const stages = [
    { name: "Pending",    icon: Clock,        color: "bg-gray-400",    key: "pending" },
    { name: "Processing", icon: PlayCircle,   color: "bg-amber-500",   key: "processing" },
    { name: "Finished",   icon: CheckCircle2, color: "bg-emerald-500", key: "finished" },
  ];

  function ProductionCard({ prod }: { prod: any }) {
    return (
      <div className="p-4 rounded-xl border border-[#E5DDD5] hover:border-[#C9A84C] transition-colors bg-white">
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
            {canEdit && prod.status !== "finished" && (
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

  const filteredProductions = productions.filter(p => p.status === activeTab);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-extrabold text-[#1A1210]">Production Control</h2>
          <p className="text-[#7A6055]">Monitor manufacturing stages for furniture orders.</p>
        </div>
        
        <div className="flex bg-[#F5F2EA] p-1 rounded-xl gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === "pending" 
                ? "bg-[#2C1810] text-white shadow-md" 
                : "text-[#7A6055] hover:text-[#1A1210]"
            }`}
          >
            Pending ({productions.filter(p => p.status === "pending").length})
          </button>
          <button
            onClick={() => setActiveTab("processing")}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === "processing" 
                ? "bg-[#C9A84C] text-white shadow-md" 
                : "text-[#7A6055] hover:text-[#1A1210]"
            }`}
          >
            Started ({productions.filter(p => p.status === "processing").length})
          </button>
          <button
            onClick={() => setActiveTab("finished")}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === "finished" 
                ? "bg-[#1E8449] text-white shadow-md" 
                : "text-[#7A6055] hover:text-[#1A1210]"
            }`}
          >
            Finished ({productions.filter(p => p.status === "finished").length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C9A84C]"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProductions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E5DDD5] py-20 text-center">
              <Hammer size={48} className="mx-auto text-[#E5DDD5] mb-4" />
              <p className="text-[#A89080]">No {activeTab} production orders found.</p>
            </div>
          ) : (
            filteredProductions.map(prod => <ProductionCard key={prod._id} prod={prod} />)
          )}
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
