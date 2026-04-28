"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
    LayoutDashboard, Package, Users, ShoppingCart,
    TruckIcon, Briefcase, LogOut, ChevronLeft, ChevronRight,
    ReceiptText, Hammer, Database, ShoppingBag, 
    Truck, Receipt, BarChart3, Settings, FileText
} from "lucide-react";
import { useState } from "react";
import { useSession } from "next-auth/react";

const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/quotations", label: "Quotations", icon: FileText },
    { href: "/sales", label: "Sales Orders", icon: ReceiptText },
    { href: "/production", label: "Production", icon: Hammer },
    { href: "/deliveries", label: "Delivery", icon: Truck },
    { href: "/invoices", label: "Invoice", icon: Receipt },
    { href: "/products", label: "Products", icon: Package },
    { href: "/customers", label: "Customers", icon: Users },
    { href: "/suppliers", label: "Suppliers", icon: TruckIcon },
    { href: "/materials", label: "Raw Materials", icon: Database },
    { href: "/purchases", label: "Purchases", icon: ShoppingBag },
    { href: "/expenses", label: "Expenses", icon: Receipt },
    { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    const w = collapsed ? 72 : 260;

    return (
        <aside style={{
            position: "relative",
            width: w,
            minWidth: w,
            height: "100vh",
            background: "#1A0F0A",
            borderRight: "1px solid #2C1810",
            display: "flex",
            flexDirection: "column",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: "4px 0 24px rgba(0,0,0,0.2)",
            color: "#E5DDD5"
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
                    background: "linear-gradient(135deg, #C9A84C 0%, #8B5E3C 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    boxShadow: "0 4px 12px rgba(201, 168, 76, 0.3)"
                }}>
                    <Briefcase size={18} color="#fff" />
                </div>
                {!collapsed && (
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontWeight: 800, fontSize: 16, color: "#E8C97A", letterSpacing: "-0.02em" }}>DIAMOND HOME</span>
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>Furniture ERP</span>
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
                {navItems.map(({ href, label, icon: Icon }) => {
                    const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
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
                                background: active ? "rgba(201, 168, 76, 0.1)" : "transparent",
                                color: active ? "#E8C97A" : "rgba(255,255,255,0.6)",
                                transition: "all 0.2s ease",
                                border: active ? "1px solid rgba(201, 168, 76, 0.2)" : "1px solid transparent"
                            }}
                        >
                            <Icon size={20} style={{
                                flexShrink: 0,
                                color: active ? "#E8C97A" : "rgba(255,255,255,0.4)"
                            }} />
                            {!collapsed && <span>{label}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* user profile / logout */}
            <div className="logout-container" style={{ padding: "16px 12px 24px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
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
                    background: "#1A0F0A",
                    border: "1px solid rgba(201, 168, 76, 0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.3)",
                    zIndex: 20,
                    transition: "transform 0.2s"
                }}
            >
                {collapsed ? <ChevronRight size={14} color="#C9A84C" /> : <ChevronLeft size={14} color="#C9A84C" />}
            </button>
        </aside>
    );
}