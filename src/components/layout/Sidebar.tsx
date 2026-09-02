"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  TruckIcon,
  Briefcase,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ReceiptText,
  Hammer,
  Database,
  ShoppingBag,
  Truck,
  Receipt,
  BarChart3,
  Settings,
  FileText,
  Shield,
  Ban,
  Undo2,
} from "lucide-react";
import { useState } from "react";
import { useSession } from "next-auth/react";
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
    href: "/quotations",
    label: "Quotations",
    icon: FileText,
    permissionKey: "quotations",
  },
  {
    href: "/sales",
    label: "Sales Orders",
    icon: ReceiptText,
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
  { href: "/items", label: "Inventory", icon: Package, permissionKey: "items" },
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
    label: "Raw Materials",
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
    href: "/purchasers",
    label: "Purchasers",
    icon: Users,
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

export default function Sidebar() {
  const { t } = useLanguage();
  const { data: session } = useSession();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const isAdmin = session?.user?.role === "admin";
  const userPermissions = (session?.user as any)?.permissions || {};

  const filteredNavItems = navItems.filter((item) => {
    // Admins see everything
    if (isAdmin) return true;

    // Non-admins can't see adminOnly items
    if (item.adminOnly) return false;

    // If there's a permission key, check for 'view' permission
    if (item.permissionKey) {
      return userPermissions[item.permissionKey]?.view === true;
    }

    return true;
  });

  const w = collapsed ? 72 : 260;

  return (
    <aside
      style={{
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
        color: "#E5DDD5",
      }}
    >
      {/* logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: collapsed ? "24px 0" : "24px 20px",
          justifyContent: collapsed ? "center" : "flex-start",
          marginBottom: 8,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "linear-gradient(135deg, #C9A84C 0%, #8B5E3C 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 4px 12px rgba(201, 168, 76, 0.3)",
          }}
        >
          <Briefcase size={18} color="#fff" />
        </div>
        {!collapsed && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontWeight: 800,
                fontSize: 16,
                color: "#E8C97A",
                letterSpacing: "-0.02em",
              }}
            >
              {t("diamondHome")}
            </span>
            <span
              style={{
                fontSize: 10,
                color: "rgba(255,255,255,0.45)",
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {t("furnitureErp")}
            </span>
          </div>
        )}
      </div>

      {/* nav */}
      <nav
        style={{
          flex: 1,
          padding: "8px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
          overflowY: "auto",
          scrollbarWidth: "none",
        }}
      >
        {filteredNavItems.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
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
                border: active
                  ? "1px solid rgba(201, 168, 76, 0.2)"
                  : "1px solid transparent",
              }}
            >
              <Icon
                size={20}
                style={{
                  flexShrink: 0,
                  color: active ? "#E8C97A" : "rgba(255,255,255,0.4)",
                }}
              />
              {!collapsed && <span>{t(label.toLowerCase().replace(/\s+/g, "_"))}</span>}
            </Link>
          );
        })}
      </nav>

      {/* user profile / logout */}
      <div
        className="logout-container"
        style={{
          padding: "16px 12px 24px",
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <button
          onClick={() => setLogoutOpen(true)}
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
            transition: "all 0.2s",
          }}
        >
          <LogOut size={20} style={{ flexShrink: 0 }} />
          {!collapsed && <span>{t("logOut")}</span>}
        </button>
      </div>

      {/* collapse toggle */}
      <button
        onClick={() => setCollapsed((p) => !p)}
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
          transition: "transform 0.2s",
        }}
      >
        {collapsed ? (
          <ChevronRight size={14} color="#C9A84C" />
        ) : (
          <ChevronLeft size={14} color="#C9A84C" />
        )}
      </button>

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
    </aside>
  );
}
