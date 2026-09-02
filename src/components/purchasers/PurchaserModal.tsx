import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useLanguage } from "../../context/LanguageContext";

interface PurchaserModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  purchaser?: any;
  loading?: boolean;
}

export default function PurchaserModal({
  open,
  onClose,
  onSubmit,
  purchaser,
  loading,
}: PurchaserModalProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
  });

  useEffect(() => {
    if (open) {
      if (purchaser) {
        setFormData({
          name: purchaser.name || "",
          mobile: purchaser.mobile || "",
        });
      } else {
        setFormData({ name: "", mobile: "" });
      }
    }
  }, [open, purchaser]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
        dir={document.documentElement.dir}
      >
        <div className="flex justify-between items-center p-6 border-b border-[#E5DDD5] bg-[#FAF8F6]">
          <h2 className="text-xl font-bold text-[#1A1210]">
            {purchaser ? t("editPurchaser") : t("addPurchaser")}
          </h2>
          <button
            onClick={onClose}
            className="text-[#A89080] hover:text-[#1A1210] transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#2C1810] mb-1">
              {t("name")} <span className="text-rose-500">*</span>
            </label>
            <Input
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder={t("enterPurchaserName")}
              className="border-[#E5DDD5]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#2C1810] mb-1">
              {t("mobile")}
            </label>
            <Input
              value={formData.mobile}
              onChange={(e) =>
                setFormData({ ...formData, mobile: e.target.value })
              }
              placeholder={t("enterMobileNumber")}
              className="border-[#E5DDD5]"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-[#E5DDD5] mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-[#E5DDD5] text-[#7A6055]"
              disabled={loading}
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              className="bg-[#2C1810] hover:bg-[#1A0F0A] text-white"
              disabled={loading}
            >
              {loading ? t("saving") : t("save")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
