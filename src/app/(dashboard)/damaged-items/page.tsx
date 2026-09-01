"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Ban, Plus, Pencil, Trash2 } from "lucide-react";
import Pagination from "@/components/ui/Pagination";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Select from "react-select";
import { toast } from "react-hot-toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import { IItem } from "@/types";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Spinner from "@/components/ui/Spinner";
import { motion } from "framer-motion";
import { useLanguage } from "../../../context/LanguageContext";

const DAMAGE_REASONS = [
  "Damaged in transit / delivery",
  "Damaged in workshop / production",
  "Customer return — defective",
  "Showroom damage / accident",
  "Water / moisture damage",
  "Pest / termite damage",
  "Broken during assembly",
  "Manufacturing defect",
  "Scratch / surface damage",
  "Other disposal",
];

export default function DamagedItemsPage() {
  const { t } = useLanguage();
  const [damagedItems, setDamagedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [items, setItems] = useState<IItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [editingDamage, setEditingDamage] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedItemBatches, setSelectedItemBatches] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    itemId: "",
    itemNumber: "",
    itemName: "",
    quantity: 1,
    batch: "",
    reason: "",
    date: new Date().toISOString().split("T")[0] ?? "",
  });

  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const perms = (session?.user?.permissions as any)?.damaged_items;
  const canCreate = isAdmin || perms?.create;
  const canEdit = isAdmin || perms?.edit;
  const canDelete = isAdmin || perms?.delete;

  useEffect(() => {
    fetchDamagedItems();
    fetchItems();
  }, [page]);

  const fetchDamagedItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/damaged-items?page=${page}&limit=12`);
      const data = await res.json();
      setDamagedItems(data.data || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 0);
    } catch {
      toast.error("Failed to fetch records");
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/items?limit=500");
      const data = await res.json();
      setItems(data.data || []);
    } catch {
      /* silent */
    }
  };

  const handleItemSelect = (item: IItem) => {
    setFormData({
      ...formData,
      itemId: item._id,
      itemNumber: item.itemNumber,
      itemName: item.name,
      batch: "",
    });
    setSelectedItemBatches(item.batches || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.itemId) return toast.error("Please select a furniture item");

    const selectedItem = items.find((i) => i._id === formData.itemId);
    if (selectedItem) {
      let maxQty = formData.batch
        ? selectedItem.batches?.find((b) => b.batchNumber === formData.batch)
            ?.quantity || 0
        : selectedItem.quantity || 0;
      if (
        editingDamage &&
        editingDamage.itemId === formData.itemId &&
        editingDamage.batch === formData.batch
      ) {
        maxQty += editingDamage.quantity;
      }
      if (Number(formData.quantity) > maxQty) {
        return toast.error(
          `Cannot exceed available quantity (${maxQty} ${selectedItem.unit || "pcs"})`,
        );
      }
    }

    try {
      const url = editingDamage
        ? `/api/damaged-items/${editingDamage._id}`
        : "/api/damaged-items";
      const method = editingDamage ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        toast.success(editingDamage ? "Record updated" : "Damage recorded");
        setModalOpen(false);
        fetchDamagedItems();
        fetchItems();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to save");
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/damaged-items/${deleteId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Record deleted — quantity restored to inventory");
        setDeleteId(null);
        fetchDamagedItems();
        fetchItems();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete");
      }
    } catch {
      toast.error("Failed");
    } finally {
      setDeleting(false);
    }
  };

  const openCreate = () => {
    setEditingDamage(null);
    setFormData({
      itemId: "",
      itemNumber: "",
      itemName: "",
      quantity: 1,
      batch: "",
      reason: "",
      date: new Date().toISOString().split("T")[0] ?? "",
    });
    setSelectedItemBatches([]);
    setModalOpen(true);
  };

  return (
    <div className="page-container">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: "#1A1210",
              margin: 0,
            }}
          >
            {t("damagedDefectiveItems")}
          </h1>
          <p style={{ fontSize: 13, color: "#7A6055", margin: "4px 0 0" }}>
            {t("trackFurnitureDamagedInTransit")}
          </p>
        </div>
        {canCreate && (
          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={openCreate}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "10px 20px",
              borderRadius: 10,
              border: "none",
              background: "linear-gradient(135deg, #C0392B, #E74C3C)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(192,57,43,0.25)",
            }}
          >
            <Ban size={16} /> {t("recordDamage")}
          </motion.button>
        )}
      </motion.div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="w-full">
          <thead>
            <tr>
              <th className="th">{t("furnitureItem")}</th>
              <th className="th text-end">{t("qtyLost")}</th>
              <th className="th text-center">{t("reason")}</th>
              <th className="th text-center">{t("date")}</th>
              {isAdmin && <th className="th text-center">{t("recordedBy")}</th>}
              <th className="th text-end">{t("actions")}</th>
            </tr>
          </thead>
          <tbody style={{ borderColor: "#F0EAE3" }}>
            {loading ? (
              <tr>
                <td
                  colSpan={isAdmin ? 6 : 5}
                  style={{ textAlign: "center", padding: "48px 0" }}
                >
                  <Spinner />
                </td>
              </tr>
            ) : damagedItems.length === 0 ? (
              <tr>
                <td
                  colSpan={isAdmin ? 6 : 5}
                  style={{ textAlign: "center", padding: "64px 0" }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <Ban size={36} color="#E5DDD5" />
                    <p style={{ color: "#A89080", fontSize: 14, margin: 0 }}>
                      {t("noDamageRecordsFound")}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              damagedItems.map((item, idx) => (
                <motion.tr
                  key={item._id}
                  className="tr-hover"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  style={{ borderBottom: "1px solid #F0EAE3" }}
                >
                  <td className="td">
                    <div
                      style={{
                        fontWeight: 700,
                        color: "#1A1210",
                        fontSize: 13,
                      }}
                    >
                      {item.itemName}
                    </div>
                    <div
                      style={{
                        fontFamily: "monospace",
                        fontSize: 10,
                        color: "#A89080",
                      }}
                    >
                      {item.itemNumber}
                    </div>
                  </td>
                  <td className="td text-end">
                    <span
                      style={{
                        fontWeight: 800,
                        fontSize: 16,
                        color: "#C0392B",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 3,
                      }}
                    >
                      −{item.quantity}
                    </span>
                  </td>
                  <td className="td text-center">
                    <span
                      style={{
                        display: "inline-block",
                        padding: "3px 12px",
                        borderRadius: 20,
                        maxWidth: 220,
                        fontSize: 11,
                        fontWeight: 600,
                        background: "#FDEDEC",
                        color: "#C0392B",
                        border: "1px solid #F5B7B1",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {item.reason}
                    </span>
                  </td>
                  <td
                    className="td text-center"
                    style={{ fontSize: 12, color: "#7A6055" }}
                  >
                    {formatDate(item.date)}
                  </td>
                  {isAdmin && (
                    <td className="td text-center">
                      <span style={{ fontSize: 11, color: "#A89080" }}>
                        {item.createdBy?.name || "Admin"}
                      </span>
                    </td>
                  )}
                  <td className="td text-end">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 4,
                      }}
                    >
                      {canEdit && (
                        <button
                          onClick={() => {
                            setEditingDamage(item);
                            setFormData({
                              itemId: item.itemId,
                              itemNumber: item.itemNumber,
                              itemName: item.itemName,
                              batch: item.batch || "",
                              quantity: item.quantity,
                              reason: item.reason,
                              date: item.date.split("T")[0],
                            });
                            const found = items.find(
                              (i) => i._id === item.itemId,
                            );
                            setSelectedItemBatches(found?.batches || []);
                            setModalOpen(true);
                          }}
                          style={{
                            padding: "6px",
                            borderRadius: 7,
                            border: "1px solid #E5DDD5",
                            background: "#fff",
                            cursor: "pointer",
                            color: "#7A6055",
                            display: "flex",
                            transition: "all 0.15s",
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.background =
                              "#EBF5FB";
                            (e.currentTarget as HTMLElement).style.color =
                              "#2980B9";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.background =
                              "#fff";
                            (e.currentTarget as HTMLElement).style.color =
                              "#7A6055";
                          }}
                        >
                          <Pencil size={13} />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => setDeleteId(item._id)}
                          style={{
                            padding: "6px",
                            borderRadius: 7,
                            border: "1px solid #E5DDD5",
                            background: "#fff",
                            cursor: "pointer",
                            color: "#7A6055",
                            display: "flex",
                            transition: "all 0.15s",
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.background =
                              "#FDEDEC";
                            (e.currentTarget as HTMLElement).style.color =
                              "#C0392B";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.background =
                              "#fff";
                            (e.currentTarget as HTMLElement).style.color =
                              "#7A6055";
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
        <div style={{ borderTop: "1px solid #F0EAE3", padding: "0 8px" }}>
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            limit={12}
            onPageChange={setPage}
          />
        </div>
      </div>

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          editingDamage ? "Edit Damage Record" : "Record Damaged Furniture"
        }
      >
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          <div>
            <label
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#5A4035",
                display: "block",
                marginBottom: 6,
                letterSpacing: "0.04em",
              }}
            >
              {t("furnitureItem")}
            </label>
            <Select
              options={items
                .filter((i) => i.quantity > 0)
                .map((i) => ({
                  value: i._id,
                  label: `${i.itemNumber} — ${i.name}  [${i.quantity} ${i.unit || "pcs"} in stock]`,
                  data: i,
                }))}
              value={
                formData.itemId
                  ? {
                      value: formData.itemId,
                      label: `${formData.itemNumber} — ${formData.itemName}`,
                      data: items.find((i) => i._id === formData.itemId),
                    }
                  : null
              }
              onChange={(opt: any) => opt && handleItemSelect(opt.data)}
              placeholder={t("searchFurnitureItem")}
              styles={{
                control: (b: any) => ({
                  ...b,
                  border: "1.5px solid #E5DDD5",
                  borderRadius: 8,
                  fontSize: 13,
                  background: "#FAF8F6",
                  minHeight: 40,
                }),
                menu: (b: any) => ({ ...b, fontSize: 13, zIndex: 9999 }),
              }}
            />
          </div>

          {selectedItemBatches.length > 0 && (
            <div>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#5A4035",
                  display: "block",
                  marginBottom: 6,
                  letterSpacing: "0.04em",
                }}
              >
                {t("purchaseBatchOptional")}
              </label>
              <Select
                options={selectedItemBatches
                  .filter((b) => b.quantity > 0)
                  .map((b) => ({
                    value: b.batchNumber,
                    label: `${b.batchNumber || "Unnamed"} — ${b.quantity} units`,
                  }))}
                value={
                  formData.batch
                    ? { value: formData.batch, label: formData.batch }
                    : null
                }
                onChange={(opt: any) =>
                  setFormData({ ...formData, batch: opt?.value || "" })
                }
                isClearable
                placeholder={t("selectSpecificBatch")}
                styles={{
                  control: (b: any) => ({
                    ...b,
                    border: "1.5px solid #E5DDD5",
                    borderRadius: 8,
                    fontSize: 13,
                    background: "#FAF8F6",
                    minHeight: 40,
                  }),
                }}
              />
            </div>
          )}

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <Input
              label={t("quantityDamaged")}
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  quantity: parseInt(e.target.value) || 1,
                })
              }
              required
            />
            <Input
              label={t("date")}
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              required
            />
          </div>

          <div>
            <label
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#5A4035",
                display: "block",
                marginBottom: 6,
                letterSpacing: "0.04em",
              }}
            >
              {t("reasonForDamage")}
            </label>
            <select
              value={formData.reason}
              onChange={(e) =>
                setFormData({ ...formData, reason: e.target.value })
              }
              required
              style={{
                width: "100%",
                height: 40,
                border: "1.5px solid #E5DDD5",
                borderRadius: 8,
                padding: "0 12px",
                fontSize: 13,
                color: "#1A1210",
                outline: "none",
                background: "#FAF8F6",
                cursor: "pointer",
              }}
            >
              <option value="">{t("selectReason")}</option>
              {DAMAGE_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            {!DAMAGE_REASONS.includes(formData.reason) && formData.reason && (
              <p style={{ fontSize: 11, color: "#C9A84C", marginTop: 4 }}>
                {t("customReasonEntered")}
              </p>
            )}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
              borderTop: "1px solid #F0EAE3",
              paddingTop: 14,
            }}
          >
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              style={{
                padding: "10px 20px",
                borderRadius: 10,
                border: "1.5px solid #E5DDD5",
                background: "#fff",
                fontSize: 14,
                fontWeight: 600,
                color: "#7A6055",
                cursor: "pointer",
              }}
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              style={{
                padding: "10px 22px",
                borderRadius: 10,
                border: "none",
                background: "linear-gradient(135deg, #C0392B, #E74C3C)",
                fontSize: 14,
                fontWeight: 700,
                color: "#fff",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(192,57,43,0.25)",
              }}
            >
              {editingDamage ? "Update Record" : "Confirm Damage"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title={t("deleteDamageRecord")}
        message={t("deleteThisRecordTheItem")}
        confirmLabel={t("delete")}
        loading={deleting}
      />
    </div>
  );
}
