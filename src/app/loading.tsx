"use client";
import { useLanguage } from "../context/LanguageContext";

export default function Loading() {
  const { t } = useLanguage();
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "60vh",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        <svg
          style={{ animation: "spin 0.8s linear infinite" }}
          width="40"
          height="40"
          viewBox="0 0 40 40"
          fill="none"
        >
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <circle
            cx="20"
            cy="20"
            r="16"
            stroke="#e5e7eb"
            strokeWidth="3"
            fill="none"
          />
          <path
            d="M20 4 a16 16 0 0 1 16 16"
            stroke="#6366f1"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
        <p style={{ margin: 0, fontSize: 14, color: "#6b7280" }}>
          {t("loadingItems")}
        </p>
      </div>
    </div>
  );
}
