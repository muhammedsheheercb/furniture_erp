"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { toast } from "sonner";
import {
  Truck,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  PackageCheck
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export default function DeliveriesPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const perms = (session?.user?.permissions as any)?.deliveries;
  const canEdit = isAdmin || perms?.edit;

  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pending" | "delivered">("pending");

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/deliveries");
      if (res.data.success) {
        setDeliveries(res.data.data);
      }
    } catch (err) {
      toast.error("Failed to load deliveries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const handleMarkDone = async (id: string) => {
    try {
      const res = await axios.put(`/api/deliveries/${id}`, { status: "delivered" });
      if (res.data.success) {
        toast.success("Delivery marked as completed!");
        fetchDeliveries();
      }
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const pending   = deliveries.filter(d => d.status !== "delivered");
  const delivered = deliveries.filter(d => d.status === "delivered");
  const shown     = activeTab === "pending" ? pending : delivered;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-[#1A1210]">Deliveries</h2>
          <p className="text-[#7A6055]">Track shipments and logistics schedule.</p>
        </div>
      </div>

      {/* Tab buttons */}
      <div className="flex gap-2 p-1 bg-[#F5F2EA] rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("pending")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "pending"
              ? "bg-[#C9A84C] text-white shadow-sm"
              : "text-[#7A6055] hover:text-[#1A1210]"
          }`}
        >
          <Clock size={15} />
          Delivery Pending
          {pending.length > 0 && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              activeTab === "pending" ? "bg-white/30 text-white" : "bg-[#C9A84C]/20 text-[#C9A84C]"
            }`}>
              {pending.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("delivered")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "delivered"
              ? "bg-[#1B3A2D] text-white shadow-sm"
              : "text-[#7A6055] hover:text-[#1A1210]"
          }`}
        >
          <PackageCheck size={15} />
          Delivered
          {delivered.length > 0 && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              activeTab === "delivered" ? "bg-white/30 text-white" : "bg-[#1B3A2D]/10 text-[#1B3A2D]"
            }`}>
              {delivered.length}
            </span>
          )}
        </button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C9A84C]"></div>
          </div>
        ) : shown.length === 0 ? (
          <div className="py-16 text-center text-[#7A6055]">
            <Truck size={40} className="mx-auto mb-3 text-[#E5DDD5]" />
            <p className="font-medium">
              {activeTab === "pending" ? "No pending deliveries." : "No delivered orders yet."}
            </p>
          </div>
        ) : (
          shown.map((delivery) => (
            <Card key={delivery._id} className={`border transition-colors ${
              delivery.status === "delivered"
                ? "border-[#D0E4D8] bg-[#F7FBF8]"
                : "border-[#E5DDD5] hover:border-[#C9A84C]"
            }`}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex gap-4">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${
                      delivery.status === "delivered"
                        ? "bg-[#E8F0EC] text-[#1B3A2D]"
                        : "bg-[#FAF8F6] text-[#8B5E3C]"
                    }`}>
                      {delivery.status === "delivered" ? <CheckCircle2 size={24} /> : <Truck size={24} />}
                    </div>
                    <div>
                      <h4 className="font-bold text-[#1A1210] flex items-center gap-2">
                        Order {delivery.saleNumber}
                        <Badge variant={delivery.status === "delivered" ? "success" : "warning"}>
                          {delivery.status === "delivered" ? "Delivered" : "Pending"}
                        </Badge>
                      </h4>
                      <p className="text-sm font-medium text-[#7A6055] mt-1">{delivery.customerName}</p>
                      <div className="mt-2 space-y-1">
                        {delivery.items.map((it: any, i: number) => (
                          <p key={i} className="text-xs text-[#A89080]">{it.itemName} (x{it.quantity})</p>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col md:items-end justify-center gap-2">
                    <div className="text-sm font-bold text-[#1A1210] flex items-center gap-2">
                      <CalendarIcon size={16} className="text-[#C9A84C]" />
                      {delivery.deliveryDate ? formatDate(delivery.deliveryDate) : "No date set"}
                    </div>
                    {delivery.deliveryAddress && (
                      <p className="text-xs text-[#A89080] text-right max-w-48 truncate">
                        {delivery.deliveryAddress}
                      </p>
                    )}
                    {canEdit && delivery.status !== "delivered" && (
                      <Button
                        onClick={() => handleMarkDone(delivery._id)}
                        className="bg-[#2C1810] hover:bg-[#1A0F0A] text-white"
                        size="sm"
                      >
                        <CheckCircle2 size={16} className="mr-2" /> Mark as Done
                      </Button>
                    )}
                    {delivery.status === "delivered" && (
                      <span className="text-xs font-semibold text-[#1B3A2D] flex items-center gap-1">
                        <CheckCircle2 size={13} /> Completed
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
