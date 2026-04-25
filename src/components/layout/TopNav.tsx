"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard, Package, Users, ShoppingCart,
  TruckIcon, Receipt, ReceiptText, Undo2, Ban, AlertTriangle,
  LogOut, FileText, Menu, X, ChevronDown
} from "lucide-react";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, permission: "dashboard" },
  { href: "/quotations", label: "Quotations", icon: FileText, permission: "quotations" },
  { href: "/sales", label: "Sales", icon: ReceiptText, permission: "sales" },
  { href: "/purchases", label: "Purchases", icon: ShoppingCart, permission: "purchases" },
  { href: "/items", label: "Inventory", icon: Package, permission: "items" },
  { href: "/customers", label: "Customers", icon: Users, permission: "customers" },
  { href: "/suppliers", label: "Suppliers", icon: TruckIcon, permission: "suppliers" },
  { href: "/expenses", label: "Expenses", icon: Receipt, permission: "expenses" },
  { href: "/sales-returns", label: "Returns", icon: Undo2, permission: "sales_returns" },
  { href: "/damaged-items", label: "Damaged", icon: Ban, permission: "damaged_items" },
  { href: "/expiry-alerts", label: "Low Stock", icon: AlertTriangle, permission: "items" },
  { href: "/users", label: "Users", icon: Users, role: "admin" },
];

export default function TopNav() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const userRole = (session?.user?.role || "").toLowerCase();
  const permissions = session?.user?.permissions || {};
  const isAuthenticating = status === "loading";

  const filteredNavItems = navItems.filter(item => {
    if (isAuthenticating) return true;
    if (status === "unauthenticated") return false;
    if (userRole === "admin") return true;
    if (item.href === "/") return true;
    if (item.role === "admin") return false;
    if (item.permission) {
      const p = (permissions as any)?.[item.permission];
      if (p && typeof p === "object") return p.view === true || p.create === true || p.edit === true || p.delete === true;
      if (p === true) return true;
    }
    return false;
  });

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <nav className="topnav px-4 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 flex-shrink-0 mr-6">
          <div className="relative w-9 h-9 flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/logo.webp"
              alt="Diamond Home"
              style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: 6 }}
            />
          </div>
          <div className="hidden sm:flex flex-col leading-tight">
            <span style={{ fontWeight: 800, fontSize: 15, color: "#E8C97A", letterSpacing: "-0.01em" }}>
              Diamond Home
            </span>
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.45)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Furniture ERP
            </span>
          </div>
        </Link>

        {/* Desktop nav links */}
        <div className="topnav-links flex items-center gap-1 flex-1 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {filteredNavItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: active ? 600 : 500,
                  textDecoration: "none",
                  color: active ? "#E8C97A" : "rgba(255,255,255,0.65)",
                  background: active ? "rgba(201,168,76,0.12)" : "transparent",
                  border: active ? "1px solid rgba(201,168,76,0.25)" : "1px solid transparent",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease",
                  flexShrink: 0,
                }}
                onMouseEnter={e => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.9)";
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)";
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.65)";
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }
                }}
              >
                <Icon size={15} style={{ flexShrink: 0 }} />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>

        {/* Right: user menu */}
        <div className="flex items-center gap-3 ml-4 flex-shrink-0">
          {/* Desktop user menu */}
          <div className="hidden md:block relative">
            <button
              onClick={() => setUserMenuOpen(p => !p)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px",
                borderRadius: 8,
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.12)",
                cursor: "pointer",
                color: "rgba(255,255,255,0.85)",
                fontSize: 13,
                fontWeight: 500,
                transition: "all 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.12)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)"}
            >
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: "linear-gradient(135deg, #C9A84C, #E8C97A)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700, color: "#1A0F0A", flexShrink: 0
              }}>
                {session?.user?.name?.[0]?.toUpperCase() || session?.user?.email?.[0]?.toUpperCase() || "U"}
              </div>
              <span className="max-w-[120px] truncate hidden lg:block">
                {session?.user?.name || session?.user?.email}
              </span>
              <ChevronDown size={14} style={{ opacity: 0.7 }} />
            </button>

            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: "absolute", right: 0, top: "calc(100% + 8px)",
                    background: "#fff", borderRadius: 12, border: "1px solid #E5DDD5",
                    boxShadow: "0 8px 32px rgba(44,24,16,0.15)", minWidth: 200,
                    overflow: "hidden", zIndex: 200
                  }}
                  onMouseLeave={() => setUserMenuOpen(false)}
                >
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid #F0EAE3" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1210" }}>
                      {session?.user?.name || "User"}
                    </div>
                    <div style={{ fontSize: 11, color: "#A89080", marginTop: 2 }}>
                      {session?.user?.email}
                    </div>
                    <div style={{
                      marginTop: 6, display: "inline-flex", alignItems: "center",
                      padding: "2px 8px", borderRadius: 20, fontSize: 10,
                      fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
                      background: userRole === "admin" ? "#FEF5E7" : "#EBF5FB",
                      color: userRole === "admin" ? "#CA6F1E" : "#2980B9",
                      border: userRole === "admin" ? "1px solid #FAD7A0" : "1px solid #AED6F1"
                    }}>
                      {userRole || "staff"}
                    </div>
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    style={{
                      width: "100%", padding: "12px 16px", display: "flex", alignItems: "center",
                      gap: 10, background: "none", border: "none", cursor: "pointer",
                      color: "#C0392B", fontSize: 13, fontWeight: 500,
                      transition: "background 0.15s"
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#FDEDEC"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                  >
                    <LogOut size={15} />
                    Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden"
            onClick={() => setMobileOpen(p => !p)}
            style={{
              padding: 8, borderRadius: 8, background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.12)", cursor: "pointer",
              color: "rgba(255,255,255,0.85)", display: "flex", alignItems: "center"
            }}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              style={{
                position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
                zIndex: 90, top: 64
              }}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.25 }}
              style={{
                position: "fixed", top: 64, left: 0, bottom: 0, width: 280,
                background: "#1A0F0A", zIndex: 91, display: "flex",
                flexDirection: "column", overflowY: "auto"
              }}
            >
              {/* User info in mobile */}
              <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: "50%",
                    background: "linear-gradient(135deg, #C9A84C, #E8C97A)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16, fontWeight: 700, color: "#1A0F0A"
                  }}>
                    {session?.user?.name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>
                      {session?.user?.name || "User"}
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>
                      {session?.user?.email}
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile nav items */}
              <nav style={{ flex: 1, padding: "12px 12px" }}>
                {filteredNavItems.map(({ href, label, icon: Icon }) => {
                  const active = isActive(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "12px 16px", borderRadius: 10, marginBottom: 4,
                        fontSize: 14, fontWeight: active ? 600 : 500,
                        textDecoration: "none",
                        color: active ? "#E8C97A" : "rgba(255,255,255,0.7)",
                        background: active ? "rgba(201,168,76,0.12)" : "transparent",
                        border: active ? "1px solid rgba(201,168,76,0.2)" : "1px solid transparent",
                      }}
                    >
                      <Icon size={18} />
                      <span>{label}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Mobile logout */}
              <div style={{ padding: "12px 12px 24px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 16px", borderRadius: 10, background: "rgba(192,57,43,0.12)",
                    border: "1px solid rgba(192,57,43,0.2)", color: "#E74C3C",
                    fontSize: 14, fontWeight: 500, cursor: "pointer"
                  }}
                >
                  <LogOut size={18} />
                  Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom mobile nav bar */}
      <div className="mobile-nav" style={{
        position: "fixed", bottom: 0, left: 0, right: 0, height: 64,
        background: "#1A0F0A", borderTop: "1px solid rgba(255,255,255,0.08)",
        zIndex: 50, alignItems: "center", justifyContent: "space-around",
        padding: "0 8px", boxShadow: "0 -4px 16px rgba(0,0,0,0.3)"
      }}>
        {filteredNavItems.slice(0, 5).map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                gap: 3, padding: "8px 10px", borderRadius: 10,
                textDecoration: "none", minWidth: 0,
                color: active ? "#E8C97A" : "rgba(255,255,255,0.5)",
              }}
            >
              <Icon size={20} />
              <span style={{ fontSize: 9, fontWeight: active ? 600 : 400, whiteSpace: "nowrap" }}>
                {label}
              </span>
            </Link>
          );
        })}
        <button
          onClick={() => setMobileOpen(p => !p)}
          style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            gap: 3, padding: "8px 10px", borderRadius: 10,
            background: "none", border: "none", cursor: "pointer",
            color: "rgba(255,255,255,0.5)"
          }}
        >
          <Menu size={20} />
          <span style={{ fontSize: 9, fontWeight: 400 }}>More</span>
        </button>
      </div>
    </>
  );
}
