"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { 
  Truck, 
  Calendar as CalendarIcon, 
  MapPin, 
  CheckCircle2,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-[#1A1210]">Deliveries</h2>
          <p className="text-[#7A6055]">Track shipments and logistics schedule.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="py-10 text-center text-[#7A6055]">Loading...</div>
        ) : deliveries.length === 0 ? (
          <div className="py-10 text-center text-[#7A6055]">No deliveries found.</div>
        ) : (
          deliveries.map((delivery) => (
            <Card key={delivery._id} className="border-[#E5DDD5] hover:border-[#C9A84C] transition-colors">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex gap-4">
                    <div className="h-12 w-12 rounded-xl bg-[#FAF8F6] flex items-center justify-center text-[#8B5E3C]">
                      <Truck size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#1A1210] flex items-center gap-2">
                        Order {delivery.saleNumber}
                        <Badge variant={delivery.status === "delivered" ? "success" : "warning"}>
                          {delivery.status}
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
                      {delivery.status === "delivered" ? formatDate(delivery.deliveryDate) : "Pending"}
                    </div>
                    {delivery.status !== "delivered" && (
                      <Button 
                        onClick={() => handleMarkDone(delivery._id)}
                        className="bg-[#2C1810] hover:bg-[#1A0F0A] text-white"
                        size="sm"
                      >
                        <CheckCircle2 size={16} className="mr-2" /> Mark as Done
                      </Button>
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
