"use client";
import { AlertTriangle, Info, CheckCircle } from "lucide-react";
import Button from "@/components/ui/Button";

type ConfirmVariant = "danger" | "warning" | "info" | "success";

const config: Record<ConfirmVariant, {
    icon: React.ReactNode;
    iconBg: string;
    confirmVariant: "danger" | "primary" | "success";
}> = {
    danger: {
        icon: <AlertTriangle size={22} className="text-red-600" />,
        iconBg: "bg-red-100",
        confirmVariant: "danger",
    },
    warning: {
        icon: <AlertTriangle size={22} className="text-amber-600" />,
        iconBg: "bg-amber-100",
        confirmVariant: "primary",
    },
    info: {
        icon: <Info size={22} className="text-indigo-600" />,
        iconBg: "bg-indigo-100",
        confirmVariant: "primary",
    },
    success: {
        icon: <CheckCircle size={22} className="text-emerald-600" />,
        iconBg: "bg-emerald-100",
        confirmVariant: "success",
    },
};

interface ConfirmModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: ConfirmVariant;
    loading?: boolean;
}

export default function ConfirmModal({
    open, onClose, onConfirm,
    title, message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    variant = "danger",
    loading = false,
}: ConfirmModalProps) {
    if (!open) return null;

    const { icon, iconBg, confirmVariant } = config[variant];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-white rounded-xl shadow-xl p-6">
                <div className="flex flex-col items-center text-center gap-3">
                    <div className={`p-3 rounded-full ${iconBg}`}>{icon}</div>
                    <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
                    <p className="text-sm text-gray-500">{message}</p>
                </div>
                <div className="flex gap-3 mt-6">
                    <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
                        {cancelLabel}
                    </Button>
                    <Button variant={confirmVariant} className="flex-1" onClick={onConfirm} loading={loading}>
                        {confirmLabel}
                    </Button>
                </div>
            </div>
        </div>
    );
}