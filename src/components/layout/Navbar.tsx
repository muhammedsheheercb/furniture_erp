"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Package,
  Users,
  TruckIcon,
  LogOut,
  ReceiptText,
  Hammer,
  Database,
  ShoppingBag,
  Truck,
  Receipt,
  Settings,
  FileText,
  Bell,
  User,
  ChevronDown,
  Shield,
  Undo2,
  Calendar,
  X,
} from "lucide-react";
import { useDateFilter } from "@/context/DateFilterContext";
import { useSession } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "../../context/LanguageContext";
import ConfirmModal from "@/components/ui/ConfirmModal";

interface NavItem {
  href: string;
  label: string;
  icon: any;
  permissionKey?: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    permissionKey: "dashboard",
  },
  {
    href: "/invoices",
    label: "Invoice",
    icon: Receipt,
    permissionKey: "invoices",
  },
  {
    href: "/products",
    label: "Products",
    icon: Package,
    permissionKey: "items",
  },
  {
    href: "/customers",
    label: "Customers",
    icon: Users,
    permissionKey: "customers",
  },
  {
    href: "/suppliers",
    label: "Suppliers",
    icon: TruckIcon,
    permissionKey: "suppliers",
  },
  { href: "/users", label: "Workers", icon: Shield, adminOnly: true },
  {
    href: "/materials",
    label: "Materials",
    icon: Database,
    permissionKey: "items",
  },
  {
    href: "/purchases",
    label: "Purchases",
    icon: ShoppingBag,
    permissionKey: "purchases",
  },
  {
    href: "/expenses",
    label: "Expenses",
    icon: Receipt,
    permissionKey: "expenses",
  },
  { href: "/settings", label: "Settings", icon: Settings, adminOnly: true },
];

const salesDropdownItems: NavItem[] = [
  {
    href: "/quotations",
    label: "Quotations",
    icon: FileText,
    permissionKey: "quotations",
  },
  { href: "/sales", label: "Sales", icon: ReceiptText, permissionKey: "sales" },
  {
    href: "/sales/returns",
    label: "Returns",
    icon: Undo2,
    permissionKey: "sales",
  },
  {
    href: "/production",
    label: "Production",
    icon: Hammer,
    permissionKey: "production",
  },
  {
    href: "/production-workers",
    label: "Production Workers",
    icon: Users,
    permissionKey: "production",
  },
  {
    href: "/deliveries",
    label: "Delivery",
    icon: Truck,
    permissionKey: "deliveries",
  },
];

export default function Navbar() {
  const { t, language, setLanguage } = useLanguage();
  const { data: session } = useSession();
  const pathname = usePathname();
  const [salesOpen, setSalesOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const isAdmin = session?.user?.role === "admin";
  const userPermissions = (session?.user as any)?.permissions || {};

  const filteredNavItems = navItems.filter((item) => {
    if (isAdmin) return true;
    if (item.adminOnly) return false;
    if (item.permissionKey)
      return userPermissions[item.permissionKey]?.view === true;
    return true;
  });

  const filteredSalesItems = salesDropdownItems.filter((item) => {
    if (isAdmin) return true;
    if (item.permissionKey)
      return userPermissions[item.permissionKey]?.view === true;
    return true;
  });

  const isSalesActive = filteredSalesItems.some(
    ({ href }) => pathname === href || pathname.startsWith(href),
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const dropdown = document.getElementById("sales-dropdown-portal");
      if (
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        dropdown &&
        !dropdown.contains(target)
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
    setSalesOpen((prev) => !prev);
  }

  const dropdown =
    salesOpen && mounted
      ? createPortal(
          <div
            id="sales-dropdown-portal"
            style={{
              position: "fixed",
              top: dropdownPos.top,
              left: dropdownPos.left,
              background: "#FFFFFF",
              border: "1px solid var(--border)",
              borderRadius: 10,
              boxShadow: "0 10px 30px rgba(46, 37, 32, 0.08)",
              minWidth: 190,
              zIndex: 9999,
              overflow: "hidden",
            }}
          >
            {filteredSalesItems.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setSalesOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "12px 18px",
                    fontSize: 13,
                    fontWeight: 500,
                    textDecoration: "none",
                    transition: "background 0.15s",
                    background: active
                      ? "rgba(197, 168, 128, 0.12)"
                      : "transparent",
                    color: active ? "var(--primary)" : "var(--text-secondary)",
                    borderLeft: active
                      ? "3px solid var(--gold)"
                      : "3px solid transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.background =
                        "rgba(0,0,0,0.03)";
                      (e.currentTarget as HTMLElement).style.color =
                        "var(--primary)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.background =
                        "transparent";
                      (e.currentTarget as HTMLElement).style.color =
                        "var(--text-secondary)";
                    }
                  }}
                >
                  <Icon
                    size={15}
                    color={active ? "var(--primary)" : "var(--text-muted)"}
                  />
                  <span>{t(label.toLowerCase().replace(/\s+/g, "_")) || label}</span>
                </Link>
              );
            })}
          </div>,
          document.body,
        )
      : null;

  const { startDate, endDate, setStartDate, setEndDate, clearDates } =
    useDateFilter();

  return (
    <header
      style={{
        background: "#FFFFFF",
        color: "var(--text)",
        position: "sticky",
        top: 0,
        zIndex: 50,
        boxShadow: "0 2px 16px rgba(46, 37, 32, 0.04)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {/* Top row: Logo + Profile */}
      <div
        style={{
          maxWidth: 1600,
          margin: "0 auto",
          padding: "0 20px",
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--border)",
        }}
      >
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/logo.webp"
            alt={t("diamondHome")}
            style={{
              width: 40,
              height: 40,
              objectFit: "contain",
              borderRadius: 8,
            }}
          />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontWeight: 800,
                fontSize: 17,
                color: "var(--primary)",
                lineHeight: 1,
                letterSpacing: "-0.01em",
              }}
            >
              {t("diamondHome")}
            </span>
            <span
              style={{
                fontSize: 10,
                color: "var(--text-muted)",
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginTop: 3,
              }}
            >
              {t("furnitureErp")}
            </span>
          </div>
        </div>

        {/* Right: bell + lang + user + logout */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => setLanguage(language === "en" ? "ar" : "en")}
            style={{
              padding: "6px 12px",
              color: "var(--primary)",
              background: "rgba(197, 168, 128, 0.1)",
              border: "1px solid rgba(197, 168, 128, 0.2)",
              cursor: "pointer",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              fontWeight: 700,
              textTransform: "uppercase",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(197, 168, 128, 0.18)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(197, 168, 128, 0.1)")}
          >
            {language === "en" ? "العربية" : "English"}
          </button>

          <button
            style={{
              padding: 8,
              color: "var(--text-secondary)",
              background: "none",
              border: "none",
              cursor: "pointer",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(0,0,0,0.04)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            <Bell size={20} />
          </button>

          <div style={{ width: 1, height: 28, background: "var(--border)" }} />

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ textAlign: "right" }} className="hidden sm:block">
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--primary)",
                  lineHeight: 1,
                  margin: 0,
                }}
              >
                {session?.user?.name}
              </p>
              <p
                style={{
                  fontSize: 10,
                  color: "var(--text-muted)",
                  margin: "3px 0 0",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                {session?.user?.role || "Owner"}
              </p>
            </div>

            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: "linear-gradient(135deg, var(--bg), var(--border))",
                border: "2px solid var(--gold)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--primary)",
                fontWeight: 700,
                fontSize: 15,
                flexShrink: 0,
              }}
            >
              {session?.user?.name?.[0] || <User size={18} />}
            </div>

            <button
              onClick={() => setLogoutOpen(true)}
              title={t("logout")}
              style={{
                padding: 8,
                color: "#ef4444",
                background: "none",
                border: "none",
                cursor: "pointer",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(239,68,68,0.06)")
              }
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom row: Nav links */}
      <div
        style={{
          background: "#FAF9F6",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            maxWidth: 1600,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            padding: "0 8px",
          }}
        >
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              overflowX: "auto",
              flex: 1,
            }}
            className="scrollbar-hide"
          >
            {/* Sales Dropdown Button */}
            {filteredSalesItems.length > 0 && (
              <button
                ref={buttonRef}
                onClick={openDropdown}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "10px 14px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  margin: "4px 1px",
                  background:
                    isSalesActive || salesOpen
                      ? "rgba(197, 168, 128, 0.12)"
                      : "transparent",
                  color:
                    isSalesActive || salesOpen
                      ? "var(--primary)"
                      : "var(--text-secondary)",
                  border:
                    isSalesActive || salesOpen
                      ? "1px solid rgba(197, 168, 128, 0.25)"
                      : "1px solid transparent",
                }}
                onMouseEnter={(e) => {
                  if (!isSalesActive && !salesOpen) {
                    e.currentTarget.style.color = "var(--primary)";
                    e.currentTarget.style.background = "rgba(0,0,0,0.03)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSalesActive && !salesOpen) {
                    e.currentTarget.style.color = "var(--text-secondary)";
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <ReceiptText
                  size={16}
                  color={
                    isSalesActive || salesOpen
                      ? "var(--primary)"
                      : "var(--text-muted)"
                  }
                />
                <span>{t("sales")}</span>
                <ChevronDown
                  size={14}
                  style={{
                    transition: "transform 0.2s",
                    transform: salesOpen ? "rotate(180deg)" : "rotate(0deg)",
                    marginLeft: 2,
                    color:
                      isSalesActive || salesOpen
                        ? "var(--primary)"
                        : "var(--text-muted)",
                  }}
                />
              </button>
            )}

            {/* Remaining nav items */}
            {filteredNavItems.map(({ href, label, icon: Icon }) => {
              const active =
                pathname === href ||
                (href !== "/dashboard" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "10px 14px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                    textDecoration: "none",
                    transition: "all 0.15s",
                    margin: "4px 1px",
                    background: active
                      ? "rgba(197, 168, 128, 0.12)"
                      : "transparent",
                    color: active ? "var(--primary)" : "var(--text-secondary)",
                    border: active
                      ? "1px solid rgba(197, 168, 128, 0.25)"
                      : "1px solid transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.color =
                        "var(--primary)";
                      (e.currentTarget as HTMLElement).style.background =
                        "rgba(0,0,0,0.03)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.color =
                        "var(--text-secondary)";
                      (e.currentTarget as HTMLElement).style.background =
                        "transparent";
                    }
                  }}
                >
                  <Icon
                    size={16}
                    color={active ? "var(--primary)" : "var(--text-muted)"}
                  />
                  <span>{t(label.toLowerCase().replace(/\s+/g, "_")) || label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Global Date Filter UI */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              background: "rgba(197, 168, 128, 0.05)",
              borderRadius: 8,
              border: "1px solid rgba(197, 168, 128, 0.15)",
              margin: "4px 8px 4px auto",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Calendar size={14} color="var(--primary)" />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {t("filterDate")}
              </span>
            </div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                border: "1px solid var(--border)",
                borderRadius: 6,
                padding: "4px 8px",
                fontSize: 11,
                fontWeight: 500,
                outline: "none",
                background: "#ffffff",
                color: "var(--text)",
                height: 26,
              }}
            />
            <span
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                fontWeight: 500,
              }}
            >
              {t("to")}
            </span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                border: "1px solid var(--border)",
                borderRadius: 6,
                padding: "4px 8px",
                fontSize: 11,
                fontWeight: 500,
                outline: "none",
                background: "#ffffff",
                color: "var(--text)",
                height: 26,
              }}
            />
            {(startDate || endDate) && (
              <button
                onClick={clearDates}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "none",
                  color: "#ef4444",
                  padding: "4px 8px",
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(239, 68, 68, 0.18)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)")
                }
              >
                <X size={12} />
                <span>{t("clear")}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {dropdown}

      <ConfirmModal
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={() => signOut({ callbackUrl: "/login" })}
        title={t("confirmLogout") || "Confirm Logout"}
        message={t("logoutMessage") || "Are you sure you want to log out?"}
        confirmLabel={t("logout") || "Logout"}
        cancelLabel={t("cancel") || "Cancel"}
        variant="warning"
      />
    </header>
  );
}
