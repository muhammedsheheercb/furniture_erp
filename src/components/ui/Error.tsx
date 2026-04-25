// ─────────────────────────────────────────────────────
// src/components/ui/Error.tsx
// ─────────────────────────────────────────────────────
"use client";
import { AlertTriangle, RefreshCw, LayoutDashboard } from "lucide-react";
import Link from "next/link";

interface ErrorProps {
    error?: Error;
    reset?: () => void;
    title?: string;
    message?: string;
}

export function ErrorView({
    error,
    reset,
    title = "Something went wrong",
    message = "An unexpected error occurred. Please try again or return to the dashboard.",
}: ErrorProps) {
    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", padding: "40px 24px", textAlign: "center" }}>
            {/* icon */}
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#fef2f2", border: "1px solid #fecaca", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
                <AlertTriangle size={28} color="#ef4444" />
            </div>

            {/* text */}
            <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 700, color: "#111827" }}>{title}</h2>
            <p style={{ margin: "0 0 8px", fontSize: 14, color: "#6b7280", maxWidth: 400, lineHeight: 1.7 }}>{message}</p>

            {error?.message && (
                <div style={{ margin: "12px 0 0", padding: "8px 16px", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, fontFamily: "monospace", fontSize: 12, color: "#6b7280", maxWidth: 480 }}>
                    {error.message}
                </div>
            )}

            {/* actions */}
            <div style={{ display: "flex", gap: 12, marginTop: 32, flexWrap: "wrap", justifyContent: "center" }}>
                {reset && (
                    <button
                        onClick={reset}
                        style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: "pointer" }}
                    >
                        <RefreshCw size={16} /> Try again
                    </button>
                )}
                <Link href="/"
                    style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "#fff", color: "#374151", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, fontWeight: 500, textDecoration: "none" }}
                >
                    <LayoutDashboard size={16} /> Back to dashboard
                </Link>
            </div>
        </div>
    );
}

// also export as default for Next.js error.tsx files
export default ErrorView;





