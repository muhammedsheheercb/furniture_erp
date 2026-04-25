// ─────────────────────────────────────────────────────
// src/components/ui/NotFound.tsx
// ─────────────────────────────────────────────────────
import { FileSearch, LayoutDashboard, Package, Users, ReceiptText } from "lucide-react";
import Link from "next/link";

export function NotFound() {
    const quickLinks = [
        { href: "/", label: "Dashboard", icon: LayoutDashboard },
        { href: "/items", label: "Items", icon: Package },
        { href: "/customers", label: "Customers", icon: Users },
        { href: "/sales", label: "Sales", icon: ReceiptText },
    ];

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "70vh", padding: "40px 24px", textAlign: "center" }}>
            {/* watermark */}
            <div style={{ position: "relative", marginBottom: 32 }}>
                <span style={{ fontSize: 120, fontWeight: 800, color: "#f3f4f6", lineHeight: 1, userSelect: "none", display: "block" }}>404</span>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#eef2ff", border: "1px solid #c7d2fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <FileSearch size={28} color="#6366f1" />
                    </div>
                </div>
            </div>

            {/* text */}
            <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 700, color: "#111827" }}>Page not found</h2>
            <p style={{ margin: 0, fontSize: 14, color: "#6b7280", maxWidth: 380, lineHeight: 1.7 }}>
                The page you are looking for does not exist or has been moved. Use the links below to navigate back.
            </p>

            {/* divider */}
            <div style={{ width: 48, height: 1, background: "#e5e7eb", margin: "28px 0" }} />

            {/* quick links */}
            <p style={{ margin: "0 0 16px", fontSize: 12, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em" }}>Quick navigation</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", maxWidth: 480 }}>
                {quickLinks.map(({ href, label, icon: Icon }) => (
                    <Link key={href} href={href}
                        style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 16px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, fontWeight: 500, color: "#374151", textDecoration: "none" }}
                    >
                        <Icon size={15} color="#6366f1" />
                        {label}
                    </Link>
                ))}
            </div>

            {/* main cta */}
            <Link href="/"
                style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 24, padding: "10px 24px", background: "#6366f1", color: "#fff", borderRadius: 8, fontSize: 14, fontWeight: 500, textDecoration: "none" }}
            >
                <LayoutDashboard size={16} /> Go to dashboard
            </Link>
        </div>
    );
}

export default NotFound;