"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { toast } from "sonner";
import { useDateFilter } from "@/context/DateFilterContext";
import {
  Truck,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  PackageCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import Pagination from "@/components/ui/Pagination";
import Modal from "@/components/ui/Modal";
import { useLanguage } from "../../../context/LanguageContext";

export default function DeliveriesPage() {
  const { t } = useLanguage();
  const { data: session } = useSession();
  const { startDate, endDate } = useDateFilter();
  const isAdmin = session?.user?.role === "admin";
  const perms = (session?.user?.permissions as any)?.deliveries;
  const canEdit = isAdmin || perms?.edit;

  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pending" | "delivered">(
    "pending",
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(
    null,
  );
  const [driverName, setDriverName] = useState("");
  const [driverContact, setDriverContact] = useState("");
  const [finishing, setFinishing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      params.set("page", page.toString());
      params.set("limit", limit.toString());
      const res = await axios.get(`/api/deliveries?${params}`);
      if (res.data.success) {
        setDeliveries(res.data.data);
        setTotalPages(res.data.totalPages || 1);
        setTotal(res.data.total || 0);
      }
    } catch (err) {
      toast.error("Failed to load deliveries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [startDate, endDate]);
  useEffect(() => {
    fetchDeliveries();
  }, [startDate, endDate, page]);

  const handleMarkDone = (delivery: any) => {
    setSelectedDeliveryId(delivery._id);
    setDriverName(delivery.driverName || "");
    setDriverContact(delivery.driverContact || "");
    setModalOpen(true);
  };

  const handleConfirmDelivery = async () => {
    if (!driverName.trim()) {
      toast.error("Driver Name is required");
      return;
    }
    if (!driverContact.trim()) {
      toast.error("Driver Contact/Mobile is required");
      return;
    }
    if (!/^\d+$/.test(driverContact.trim())) {
      toast.error("Driver Contact/Mobile must contain only numbers");
      return;
    }

    setFinishing(true);
    try {
      const res = await axios.put(`/api/deliveries/${selectedDeliveryId}`, {
        status: "delivered",
        driverName: driverName.trim(),
        driverContact: driverContact.trim(),
      });
      if (res.data.success) {
        toast.success("Delivery marked as completed!");
        setModalOpen(false);
        fetchDeliveries();
      }
    } catch (err) {
      toast.error("Failed to complete delivery");
    } finally {
      setFinishing(false);
    }
  };

  const pending = deliveries.filter((d) => d.status !== "delivered");
  const delivered = deliveries.filter((d) => d.status === "delivered");
  const shown = activeTab === "pending" ? pending : delivered;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-[#1A1210]">
            {t("deliveries")}
          </h2>
          <p className="text-[#7A6055]">
            {t("trackShipmentsAndLogisticsSchedule")}
          </p>
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
          {t("deliveryPending")}
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
          {t("delivered")}
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
              {activeTab === "pending"
                ? "No pending deliveries."
                : "No delivered orders yet."}
            </p>
          </div>
        ) : (
          shown.map((delivery) => (
            <Card
              key={delivery._id}
              className={`border transition-colors ${
                delivery.status === "delivered"
                  ? "border-[#D0E4D8] bg-[#F7FBF8]"
                  : "border-[#E5DDD5] hover:border-[#C9A84C]"
              }`}
            >
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex gap-4">
                    <div
                      className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${
                        delivery.status === "delivered"
                          ? "bg-[#E8F0EC] text-[#1B3A2D]"
                          : "bg-[#FAF8F6] text-[#8B5E3C]"
                      }`}
                    >
                      {delivery.status === "delivered" ? (
                        <CheckCircle2 size={24} />
                      ) : (
                        <Truck size={24} />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-[#1A1210] flex items-center gap-2">
                        {t("order")}
                        {delivery.saleNumber}
                        <Badge
                          variant={
                            delivery.status === "delivered"
                              ? "success"
                              : "warning"
                          }
                        >
                          {delivery.status === "delivered"
                            ? "Delivered"
                            : "Pending"}
                        </Badge>
                      </h4>
                      <p className="text-sm font-medium text-[#7A6055] mt-1">
                        {delivery.customerName}
                      </p>
                      <div className="mt-2 space-y-1">
                        {delivery.items.map((it: any, i: number) => (
                          <p key={i} className="text-xs text-[#A89080]">
                            {it.itemName} {t("x")}
                            {it.quantity})
                          </p>
                        ))}
                      </div>
                      {(delivery.driverName || delivery.driverContact) && (
                        <div className="mt-3 pt-3 border-t border-[#E5DDD5]/40 space-y-1 max-w-xs">
                          {delivery.driverName && (
                            <p className="text-xs text-[#7A6055] flex justify-between gap-4">
                              <span className="font-semibold text-[#8B5E3C]">
                                {t("driverName")}
                              </span>
                              <span className="font-bold text-[#1A1210]">
                                {delivery.driverName}
                              </span>
                            </p>
                          )}
                          {delivery.driverContact && (
                            <p className="text-xs text-[#7A6055] flex justify-between gap-4">
                              <span className="font-semibold text-[#8B5E3C]">
                                {t("driverMobile")}
                              </span>
                              <span className="font-bold text-indigo-600 font-mono">
                                {delivery.driverContact}
                              </span>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col md:items-end justify-center gap-2">
                    <div className="text-sm font-bold text-[#1A1210] flex items-center gap-2">
                      <CalendarIcon size={16} className="text-[#C9A84C]" />
                      {delivery.deliveryDate
                        ? formatDate(delivery.deliveryDate)
                        : "No date set"}
                    </div>
                    {delivery.deliveryAddress && (
                      <p className="text-xs text-[#A89080] text-end max-w-48 truncate">
                        {delivery.deliveryAddress}
                      </p>
                    )}
                    {canEdit && delivery.status !== "delivered" && (
                      <Button
                        onClick={() => handleMarkDone(delivery)}
                        className="bg-[#2C1810] hover:bg-[#1A0F0A] text-white"
                        size="sm"
                      >
                        <CheckCircle2 size={16} className="me-2" />{" "}
                        {t("markAsDone")}
                      </Button>
                    )}
                    {delivery.status === "delivered" && (
                      <span className="text-xs font-semibold text-[#1B3A2D] flex items-center gap-1">
                        <CheckCircle2 size={13} /> {t("completed")}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="bg-white rounded-xl border border-[#E5DDD5]">
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            limit={limit}
            onPageChange={setPage}
          />
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={t("completeDeliveryAssignment")}
        size="md"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              disabled={finishing}
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={handleConfirmDelivery}
              loading={finishing}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {t("confirmDeliveryCompleted")}
            </Button>
          </>
        }
      >
        <div className="space-y-4 py-2">
          <p className="text-sm text-[#7A6055]">
            {t("pleaseEnterOrVerifyThe")}
          </p>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-[#7A6055] mb-1">
                {t("driverName")}
              </label>
              <input
                type="text"
                placeholder={t("egJohnDoeSalimAlfarsi")}
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                className="w-full border border-[#E5DDD5] rounded-lg px-3 py-2 text-sm bg-white text-[#1A1210] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40 font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#7A6055] mb-1">
                {t("driverContactMobileNumber")}
              </label>
              <input
                type="text"
                placeholder={t("eg96891234567")}
                value={driverContact}
                onChange={(e) => setDriverContact(e.target.value.replace(/\D/g, ""))}
                className="w-full border border-[#E5DDD5] rounded-lg px-3 py-2 text-sm bg-white text-[#1A1210] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40 font-medium"
                required
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
