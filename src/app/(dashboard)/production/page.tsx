"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { toast } from "sonner";
import { useDateFilter } from "@/context/DateFilterContext";
import { Hammer, PlayCircle, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import ProductionModal from "@/components/production/ProductionModal";
import Pagination from "@/components/ui/Pagination";
import Modal from "@/components/ui/Modal";
import { generateDeliveryChallanPDF } from "@/lib/pdf-utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useLanguage } from "../../../context/LanguageContext";

export default function ProductionPage() {
  const { t } = useLanguage();
  const { data: session } = useSession();
  const { startDate, endDate } = useDateFilter();
  const isAdmin = session?.user?.role === "admin";
  const perms = (session?.user?.permissions as any)?.production;
  const canEdit = isAdmin || perms?.edit;

  const [productions, setProductions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProd, setSelectedProd] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [finishModalOpen, setFinishModalOpen] = useState(false);
  const [finishProdId, setFinishProdId] = useState<string | null>(null);
  const [driverName, setDriverName] = useState("");
  const [driverContact, setDriverContact] = useState("");
  const [finishing, setFinishing] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "pending" | "processing" | "finished"
  >("pending");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const fetchProductions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      params.set("status", activeTab);
      params.set("page", page.toString());
      params.set("limit", limit.toString());
      const res = await axios.get(`/api/production?${params}`);
      if (res.data.success) {
        setProductions(res.data.data);
        setTotalPages(res.data.totalPages || 1);
        setTotal(res.data.total || 0);
      }
    } catch {
      toast.error("Failed to load production orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [startDate, endDate, activeTab]);
  useEffect(() => {
    fetchProductions();
  }, [startDate, endDate, activeTab, page]);

  const handleUpdateStatus = async (id: string, currentStatus: string) => {
    if (currentStatus === "pending") {
      const prod = productions.find((p) => p._id === id);
      setSelectedProd(prod);
      setModalOpen(true);
      return;
    }
    // Open modal to enter delivery partner details when marking as finished
    setFinishProdId(id);
    setDriverName("");
    setDriverContact("");
    setFinishModalOpen(true);
  };

  const handleConfirmFinish = async () => {
    if (!driverName.trim()) {
      toast.error("Driver Name is required");
      return;
    }
    if (!driverContact.trim()) {
      toast.error("Driver Contact/Mobile Number is required");
      return;
    }

    setFinishing(true);
    try {
      const res = await axios.put(`/api/production/${finishProdId}`, {
        status: "finished",
        driverName: driverName.trim(),
        driverContact: driverContact.trim(),
      });
      if (res.data.success) {
        toast.success("Production marked as finished and delivery created!");

        // Find the production order details to generate the PDF
        const prod = productions.find((p) => p._id === finishProdId);
        if (prod) {
          generateDeliveryChallanPDF({
            saleNumber: prod.saleNumber || "",
            customerName: prod.customerName || "",
            customerMobile: prod.saleId?.customerMobile || "",
            customerAddress: prod.saleId?.customerAddress || "",
            deliveryAddress: prod.saleId?.deliveryAddress || "",
            items: prod.items || [],
            driverName: driverName.trim(),
            driverContact: driverContact.trim(),
            grandTotal: prod.saleId?.total || 0,
            advancePaid: prod.saleId?.advancePaid || 0,
          });
        }

        setFinishModalOpen(false);
        fetchProductions();
      }
    } catch {
      toast.error("Failed to mark production as finished");
    } finally {
      setFinishing(false);
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
        workerId: data.workerId,
        workerName: data.workerName,
        workerContact: data.workerContact,
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

  const inProgress = productions.filter(
    (p) => p.status === "pending" || p.status === "processing",
  );
  const finished = productions.filter((p) => p.status === "finished");

  const stages = [
    { name: "Pending", icon: Clock, color: "bg-gray-400", key: "pending" },
    {
      name: "Processing",
      icon: PlayCircle,
      color: "bg-amber-500",
      key: "processing",
    },
    {
      name: "Finished",
      icon: CheckCircle2,
      color: "bg-emerald-500",
      key: "finished",
    },
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
              <h4 className="font-bold text-[#1A1210] text-lg">
                {prod.customerName}
              </h4>
              <p className="text-sm text-[#A89080]">
                {t("sale")}
                {prod.saleNumber} · {prod.items.length} {t("item")}
                {prod.items.length !== 1 ? "s" : ""}
              </p>
              <div className="flex gap-2 mt-1 flex-wrap">
                {prod.remarks && (
                  <p className="text-xs text-[#8B5E3C]">
                    {t("remarks")}
                    {prod.remarks}
                  </p>
                )}
                <p className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  {t("sales")}
                  {prod.saleId?.createdBy?.name || "—"}
                </p>
                {prod.workerName && (
                  <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    {t("worker")}
                    {prod.workerName} ({prod.workerContact})
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 max-w-sm">
            <div className="space-y-1">
              {prod.items.map((item: any, i: number) => (
                <div
                  key={i}
                  className="text-xs text-[#7A6055] flex justify-between"
                >
                  <span>
                    {item.itemName}
                    {item.color ? ` · ${item.color}` : ""}
                  </span>
                  <span className="font-bold ms-2">
                    {t("x")}
                    {item.quantity}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="text-end">
              <p className="text-xs text-[#A89080] uppercase font-bold">
                {t("status")}
              </p>
              <Badge
                variant={
                  prod.status === "finished"
                    ? "success"
                    : prod.status === "processing"
                      ? "warning"
                      : "default"
                }
              >
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

  const filteredProductions = productions.filter((p) => p.status === activeTab);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-extrabold text-[#1A1210]">
            {t("productionControl")}
          </h2>
          <p className="text-[#7A6055]">
            {t("monitorManufacturingStagesForFurniture")}
          </p>
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
            {t("pending")}
          </button>
          <button
            onClick={() => setActiveTab("processing")}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === "processing"
                ? "bg-[#C9A84C] text-white shadow-md"
                : "text-[#7A6055] hover:text-[#1A1210]"
            }`}
          >
            {t("started")}
          </button>
          <button
            onClick={() => setActiveTab("finished")}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === "finished"
                ? "bg-[#1E8449] text-white shadow-md"
                : "text-[#7A6055] hover:text-[#1A1210]"
            }`}
          >
            {t("finished")}
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
              <p className="text-[#A89080]">
                {t("no")}
                {activeTab} {t("productionOrdersFound")}
              </p>
            </div>
          ) : (
            <>
              {filteredProductions.map((prod) => (
                <ProductionCard key={prod._id} prod={prod} />
              ))}
              {totalPages > 1 && (
                <div className="mt-4 bg-white rounded-xl border border-[#E5DDD5]">
                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    total={total}
                    limit={limit}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </>
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

      <Modal
        open={finishModalOpen}
        onClose={() => setFinishModalOpen(false)}
        title={t("markProductionAsFinished")}
        size="md"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setFinishModalOpen(false)}
              disabled={finishing}
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={handleConfirmFinish}
              loading={finishing}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {t("confirmCreateDelivery")}
            </Button>
          </>
        }
      >
        <div className="space-y-4 py-2">
          <p className="text-sm text-[#7A6055]">
            {t("pleaseEnterTheDeliveryAssignment")}
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
                onChange={(e) => setDriverContact(e.target.value)}
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
