"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
    LayoutDashboard, Package, Users,
    TruckIcon, LogOut, ReceiptText, Hammer,
    Database, ShoppingBag, Truck, Receipt, Settings,
    FileText, Bell, User, ChevronDown
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

const navItems = [
    { href: "/dashboard",  label: "Dashboard",  icon: LayoutDashboard },
    { href: "/invoices",   label: "Invoice",    icon: Receipt },
    { href: "/products",   label: "Products",   icon: Package },
    { href: "/customers",  label: "Customers",  icon: Users },
    { href: "/suppliers",  label: "Suppliers",  icon: TruckIcon },
    { href: "/materials",  label: "Materials",  icon: Database },
    { href: "/purchases",  label: "Purchases",  icon: ShoppingBag },
    { href: "/expenses",   label: "Expenses",   icon: Receipt },
    { href: "/settings",   label: "Settings",   icon: Settings },
];

const salesDropdownItems = [
    { href: "/quotations", label: "Quotations", icon: FileText },
    { href: "/sales",      label: "Sales",      icon: ReceiptText },
    { href: "/production", label: "Production", icon: Hammer },
    { href: "/deliveries", label: "Delivery",   icon: Truck },
];

export default function Navbar() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const [salesOpen, setSalesOpen] = useState(false);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [mounted, setMounted] = useState(false);

    const isSalesActive = salesDropdownItems.some(
        ({ href }) => pathname === href || pathname.startsWith(href)
    );

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            const target = e.target as Node;
            const dropdown = document.getElementById("sales-dropdown-portal");
            if (
                buttonRef.current && !buttonRef.current.contains(target) &&
                dropdown && !dropdown.contains(target)
            ) {
                setSalesOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    function openDropdown() {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setDropdownPos({ top: rect.bottom + 6, left: rect.left });
        }
        setSalesOpen(prev => !prev);
    }

    const dropdown = salesOpen && mounted ? createPortal(
        <div
            id="sales-dropdown-portal"
            style={{
                position: "fixed",
                top: dropdownPos.top,
                left: dropdownPos.left,
                background: "#1B3A2D",
                border: "1px solid rgba(201,168,76,0.2)",
                borderRadius: 10,
                boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
                minWidth: 190,
                zIndex: 9999,
                overflow: "hidden",
            }}
        >
            {salesDropdownItems.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href);
                return (
                    <Link
                        key={href}
                        href={href}
                        onClick={() => setSalesOpen(false)}
                        style={{
                            display: "flex", alignItems: "center", gap: 10,
                            padding: "12px 18px",
                            fontSize: 13, fontWeight: 500,
                            textDecoration: "none",
                            transition: "background 0.15s",
                            background: active ? "rgba(201,168,76,0.1)" : "transparent",
                            color: active ? "#E8C97A" : "rgba(255,255,255,0.75)",
                            borderLeft: active ? "3px solid #E8C97A" : "3px solid transparent",
                        }}
                        onMouseEnter={e => {
                            if (!active) {
                                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
                                (e.currentTarget as HTMLElement).style.color = "#E8C97A";
                            }
                        }}
                        onMouseLeave={e => {
                            if (!active) {
                                (e.currentTarget as HTMLElement).style.background = "transparent";
                                (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.75)";
                            }
                        }}
                    >
                        <Icon size={15} color={active ? "#E8C97A" : "rgba(255,255,255,0.4)"} />
                        <span>{label}</span>
                    </Link>
                );
            })}
        </div>,
        document.body
    ) : null;

    return (
        <header style={{ background: "#1B3A2D", color: "#E8F0EC", position: "sticky", top: 0, zIndex: 50, boxShadow: "0 2px 20px rgba(0,0,0,0.25)" }}>
            {/* Top row: Logo + Profile */}
            <div style={{
                maxWidth: 1600, margin: "0 auto", padding: "0 20px",
                height: 64, display: "flex", alignItems: "center", justifyContent: "space-between",
                borderBottom: "1px solid rgba(255,255,255,0.07)"
            }}>
                {/* Brand */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/images/logo.webp"
                        alt="Diamond Home"
                        style={{ width: 40, height: 40, objectFit: "contain", borderRadius: 8 }}
                    />
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontWeight: 800, fontSize: 17, color: "#E8C97A", lineHeight: 1, letterSpacing: "-0.01em" }}>
                            DIAMOND HOME
                        </span>
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.38)", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 3 }}>
                            Furniture ERP
                        </span>
                    </div>
                </div>

                {/* Right: bell + user + logout */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                        style={{
                            padding: 8, color: "rgba(255,255,255,0.4)", background: "none",
                            border: "none", cursor: "pointer", borderRadius: "50%",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "background 0.15s",
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
                        onMouseLeave={e => e.currentTarget.style.background = "none"}
                    >
                        <Bell size={20} />
                    </button>

                    <div style={{ width: 1, height: 28, background: "rgba(255,255,255,0.1)" }} />

                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ textAlign: "right" }} className="hidden sm:block">
                            <p style={{ fontSize: 13, fontWeight: 600, color: "#E8C97A", lineHeight: 1, margin: 0 }}>
                                {session?.user?.name}
                            </p>
                            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: "3px 0 0", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                {session?.user?.role || "Owner"}
                            </p>
                        </div>

                        <div style={{
                            width: 38, height: 38, borderRadius: "50%",
                            background: "linear-gradient(135deg, #2E5E45, #1B3A2D)",
                            border: "2px solid rgba(201,168,76,0.4)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "#E8C97A", fontWeight: 700, fontSize: 15, flexShrink: 0,
                        }}>
                            {session?.user?.name?.[0] || <User size={18} />}
                        </div>

                        <button
                            onClick={() => signOut({ callbackUrl: "/login" })}
                            title="Logout"
                            style={{
                                padding: 8, color: "#f87171", background: "none",
                                border: "none", cursor: "pointer", borderRadius: "50%",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                transition: "background 0.15s",
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(248,113,113,0.1)"}
                            onMouseLeave={e => e.currentTarget.style.background = "none"}
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom row: Nav links */}
            <div style={{ background: "#163222", overflowX: "auto", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                className="scrollbar-hide">
                <nav style={{ maxWidth: 1600, margin: "0 auto", display: "flex", alignItems: "center", padding: "0 8px" }}>

                    {/* Sales Dropdown Button */}
                    <button
                        ref={buttonRef}
                        onClick={openDropdown}
                        style={{
                            display: "flex", alignItems: "center", gap: 7,
                            padding: "10px 14px", borderRadius: 8,
                            fontSize: 13, fontWeight: 500,
                            whiteSpace: "nowrap", cursor: "pointer",
                            transition: "all 0.15s",
                            margin: "4px 1px",
                            background: isSalesActive || salesOpen ? "rgba(201,168,76,0.12)" : "transparent",
                            color: isSalesActive || salesOpen ? "#E8C97A" : "rgba(255,255,255,0.55)",
                            border: isSalesActive || salesOpen ? "1px solid rgba(201,168,76,0.25)" : "1px solid transparent",
                        }}
                        onMouseEnter={e => {
                            if (!isSalesActive && !salesOpen) {
                                e.currentTarget.style.color = "#E8C97A";
                                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                            }
                        }}
                        onMouseLeave={e => {
                            if (!isSalesActive && !salesOpen) {
                                e.currentTarget.style.color = "rgba(255,255,255,0.55)";
                                e.currentTarget.style.background = "transparent";
                            }
                        }}
                    >
                        <ReceiptText size={16} color={isSalesActive || salesOpen ? "#E8C97A" : "rgba(255,255,255,0.35)"} />
                        <span>Sales</span>
                        <ChevronDown
                            size={14}
                            style={{
                                transition: "transform 0.2s",
                                transform: salesOpen ? "rotate(180deg)" : "rotate(0deg)",
                                marginLeft: 2,
                                color: isSalesActive || salesOpen ? "#E8C97A" : "rgba(255,255,255,0.35)",
                            }}
                        />
                    </button>

                    {/* Remaining nav items */}
                    {navItems.map(({ href, label, icon: Icon }) => {
                        const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
                        return (
                            <Link
                                key={href}
                                href={href}
                                style={{
                                    display: "flex", alignItems: "center", gap: 7,
                                    padding: "10px 14px", borderRadius: 8,
                                    fontSize: 13, fontWeight: 500,
                                    whiteSpace: "nowrap", textDecoration: "none",
                                    transition: "all 0.15s",
                                    margin: "4px 1px",
                                    background: active ? "rgba(201,168,76,0.12)" : "transparent",
                                    color: active ? "#E8C97A" : "rgba(255,255,255,0.55)",
                                    border: active ? "1px solid rgba(201,168,76,0.25)" : "1px solid transparent",
                                }}
                                onMouseEnter={e => {
                                    if (!active) {
                                        (e.currentTarget as HTMLElement).style.color = "#E8C97A";
                                        (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
                                    }
                                }}
                                onMouseLeave={e => {
                                    if (!active) {
                                        (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.55)";
                                        (e.currentTarget as HTMLElement).style.background = "transparent";
                                    }
                                }}
                            >
                                <Icon size={16} color={active ? "#E8C97A" : "rgba(255,255,255,0.35)"} />
                                <span>{label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {dropdown}
        </header>
    );
}
