"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
    LayoutDashboard, Package, Users, ShoppingCart,
    TruckIcon, Briefcase, LogOut, ChevronLeft, ChevronRight,
    ReceiptText, Receipt, Undo2, Ban, ShieldCheck, Clock
} from "lucide-react";
import { useState } from "react";
import { useSession } from "next-auth/react";

const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard, permission: "dashboard" },
    { href: "/items", label: "Items", icon: Package, permission: "items" },
    { href: "/customers", label: "Customers", icon: Users, permission: "customers" },
    { href: "/sales", label: "Sales", icon: ReceiptText, permission: "sales" },
    { href: "/purchases", label: "Purchases", icon: ShoppingCart, permission: "purchases" },
    { href: "/expenses", label: "Expenses", icon: Receipt, permission: "expenses" },
    { href: "/suppliers", label: "Suppliers", icon: TruckIcon, permission: "suppliers" },
    { href: "/sales-returns", label: "Sales Returns", icon: Undo2, permission: "sales_returns" },
    { href: "/damaged-items", label: "Damaged Items", icon: Ban, permission: "damaged_items" },
    { href: "/expiry-alerts", label: "Nearest Expiry", icon: Clock, permission: "items" },
    { href: "/users", label: "Users", icon: ShieldCheck, role: "admin" },
];

export default function Sidebar() {
    const { data: session, status } = useSession();
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const userRole = (session?.user?.role || "").toLowerCase();
    const permissions = session?.user?.permissions || {};
    const isAuthenticating = status === "loading";

    const filteredNavItems = navItems.filter(item => {
        if (isAuthenticating) return true;
        if (status === "unauthenticated") return false;
        if (userRole === "admin") return true;
        if (item.permission === "dashboard") return true;
        if (item.permission) {
            const p = (permissions as any)?.[item.permission];
            if (p && typeof p === 'object') {
                return p.view === true || p.create === true || p.edit === true || p.delete === true;
            }
            if (p === true) return true;
        }
        return false;
    });

    const w = collapsed ? 72 : 260;

    return (
        <aside style={{
            position: "relative",
            width: w,
            minWidth: w,
            height: "100vh",
            background: "#ffffff",
            borderRight: "1px solid #f3f4f6",
            display: "flex",
            flexDirection: "column",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: "4px 0 24px rgba(0,0,0,0.02)"
        }}>
            {/* logo */}
            <div style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: collapsed ? "24px 0" : "24px 20px",
                justifyContent: collapsed ? "center" : "flex-start",
                marginBottom: 8
            }}>
                <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)"
                }}>
                    <Briefcase size={18} color="#fff" />
                </div>
                {!collapsed && (
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontWeight: 800, fontSize: 16, color: "#111827", letterSpacing: "-0.02em" }}>CAFE DIRECT
                        </span>
                        <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>Management</span>
                    </div>
                )}
            </div>

            {/* nav */}
            <nav style={{
                flex: 1,
                padding: "8px 12px",
                display: "flex",
                flexDirection: "column",
                gap: 4,
                overflowY: "auto",
                scrollbarWidth: "none"
            }}>
                {filteredNavItems.map(({ href, label, icon: Icon }) => {
                    const active = pathname === href || (href !== "/" && pathname.startsWith(href));
                    return (
                        <Link key={href} href={href} title={collapsed ? label : undefined}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                padding: collapsed ? "12px 0" : "12px 14px",
                                borderRadius: 12,
                                fontSize: 14,
                                fontWeight: active ? 600 : 500,
                                textDecoration: "none",
                                justifyContent: collapsed ? "center" : "flex-start",
                                background: active ? "#f5f3ff" : "transparent",
                                color: active ? "#6366f1" : "#64748b",
                                transition: "all 0.2s ease",
                                border: active ? "1px solid #e0e7ff" : "1px solid transparent"
                            }}
                            onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "#f9fafb"; }}
                            onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                        >
                            <Icon size={20} style={{
                                flexShrink: 0,
                                color: active ? "#6366f1" : "#94a3b8"
                            }} />
                            {!collapsed && <span>{label}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* user profile / logout */}
            <div className="logout-container" style={{ padding: "16px 12px 24px", borderTop: "1px solid #f3f4f6" }}>
                <button onClick={() => signOut({ callbackUrl: "/login" })}
                    title={collapsed ? "Logout" : undefined}
                    style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: collapsed ? "12px 0" : "12px 14px",
                        borderRadius: 12,
                        fontSize: 14,
                        fontWeight: 500,
                        border: "none",
                        background: "transparent",
                        color: "#ef4444",
                        cursor: "pointer",
                        justifyContent: collapsed ? "center" : "flex-start",
                        transition: "all 0.2s"
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#fef2f2"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                    <LogOut size={20} style={{ flexShrink: 0 }} />
                    {!collapsed && <span>Log Out</span>}
                </button>
            </div>

            {/* collapse toggle */}
            <button onClick={() => setCollapsed(p => !p)}
                style={{
                    position: "absolute",
                    right: -14,
                    top: 32,
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "#ffffff",
                    border: "1px solid #e5e7eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                    zIndex: 20,
                    transition: "transform 0.2s"
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = "scale(1.1)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = "scale(1)"}
            >
                {collapsed ? <ChevronRight size={14} color="#6366f1" /> : <ChevronLeft size={14} color="#6366f1" />}
            </button>
        </aside>
    );
}