"use client";
import { useLanguage } from "../../context/LanguageContext";

// ─────────────────────────────────────────────────────
// src/components/ui/Loader.tsx
// ─────────────────────────────────────────────────────
interface LoaderProps {
  message?: string;
  fullPage?: boolean;
}

export function Loader({
  message = "Loading data...",
  fullPage = false,
}: LoaderProps) {
  const { t } = useLanguage();
  const inner = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
      }}
    >
      {/* spinner */}
      <div style={{ position: "relative", width: 48, height: 48 }}>
        <svg
          style={{ animation: "spin 0.8s linear infinite" }}
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
        >
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke="#e5e7eb"
            strokeWidth="3"
            fill="none"
          />
          <path
            d="M24 4 a20 20 0 0 1 20 20"
            stroke="#6366f1"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#6366f1",
            }}
          />
        </div>
      </div>

      {/* text */}
      <div style={{ textAlign: "center" }}>
        <p
          style={{ margin: 0, fontSize: 14, fontWeight: 500, color: "#374151" }}
        >
          {message}
        </p>
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "#9ca3af" }}>
          {t("erpSystem")}
        </p>
      </div>
    </div>
  );

  if (fullPage) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(255,255,255,0.85)",
          zIndex: 50,
        }}
      >
        {inner}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 0",
      }}
    >
      {inner}
    </div>
  );
}

export default Loader;
