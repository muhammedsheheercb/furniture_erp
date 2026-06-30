"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { IUser, IUserPermissions, IActionPermission } from "@/types";
import {
  Users, Mail, Shield, Plus, Edit2, Trash2,
  LayoutDashboard, Package, ShoppingCart,
  TruckIcon, Receipt, ReceiptText, Undo2, Ban,
  Eye, EyeOff, FileText, UserCheck, Hammer, Truck
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { toast } from "react-hot-toast";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Spinner from "@/components/ui/Spinner";
import { motion, AnimatePresence } from "framer-motion";
import { useDateFilter } from "@/context/DateFilterContext";

const PAGES = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "quotations", label: "Quotations", icon: FileText },
  { id: "sales", label: "Sales Orders", icon: ReceiptText },
  { id: "production", label: "Production", icon: Hammer },
  { id: "deliveries", label: "Deliveries", icon: Truck },
  { id: "items", label: "Inventory", icon: Package },
  { id: "customers", label: "Customers", icon: Users },
  { id: "suppliers", label: "Suppliers", icon: TruckIcon },
  { id: "purchases", label: "Purchases", icon: ShoppingCart },
  { id: "expenses", label: "Expenses", icon: Receipt },
  { id: "sales_returns", label: "Sales Returns", icon: Undo2 },
  { id: "damaged_items", label: "Damaged Items", icon: Ban },
  { id: "users", label: "Workers", icon: Shield },
];

const ACTIONS = ["view", "create", "edit", "delete"] as const;

export default function UsersPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const perms = (session?.user?.permissions as any)?.users;
  const canCreate = isAdmin || perms?.create;
  const canEdit = isAdmin || perms?.edit;
  const canDelete = isAdmin || perms?.delete;

  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<IUser | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [createConfirmOpen, setCreateConfirmOpen] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const initialPermissions = PAGES.reduce((acc, page) => ({
    ...acc,
    [page.id]: { view: false, create: false, edit: false, delete: false }
  }), {} as IUserPermissions);

  const [formData, setFormData] = useState({
    name: "",
    email: "diamondhome2026@gmail.com",
    password: "",
    role: "staff" as "admin" | "staff",
    permissions: initialPermissions
  });

  const { startDate, endDate } = useDateFilter();

  useEffect(() => { fetchUsers(); }, [startDate, endDate]);

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams({
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });
      const res = await fetch(`/api/users?${params}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) setUsers(data.data);
      else setUsers([]);
    } catch {
      toast.error("Failed to fetch users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const trimmedName = formData.name.trim();
    if (!trimmedName) errs.name = "Full name is required";
    if (!formData.email.includes("@")) errs.email = "Valid email is required";
    if (!editingUser && (!formData.password || formData.password.trim().length < 6)) {
      errs.password = "Password must be at least 6 characters";
    }
    const hasAnyPermission = Object.values(formData.permissions).some(p => p.view || p.create || p.edit || p.delete);
    if (!hasAnyPermission) errs.permissions = "Select at least one module permission";

    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      if (errs.name) toast.error(errs.name);
      else if (errs.password) toast.error(errs.password);
      else if (errs.permissions) toast.error(errs.permissions);
      return;
    }

    setFormErrors({});
    setCreateConfirmOpen(true);
  };

  const executeSubmit = async () => {
    setCreateConfirmOpen(false);
    try {
      const url = editingUser ? `/api/users/${editingUser._id}` : "/api/users";
      const method = editingUser ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, name: formData.name.trim() }),
      });
      if (res.ok) {
        toast.success(editingUser ? "User updated" : "User created");
        setModalOpen(false);
        fetchUsers();
      } else {
        const data = await res.json();
        toast.error(data.error || "Something went wrong");
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/users/${deleteId}`, { method: "DELETE" });
      if (res.ok) { toast.success("User deleted"); setDeleteId(null); fetchUsers(); }
    } catch {
      toast.error("Failed to delete user");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 300 }}>
      <Spinner />
    </div>
  );

  return (
    <div className="page-container">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}
      >
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1A1210", margin: 0 }}>Worker Management</h1>
          <p style={{ fontSize: 13, color: "#7A6055", margin: "4px 0 0" }}>
            Manage staff accounts and module permissions
          </p>
        </div>
        {canCreate && (
          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setEditingUser(null);
              setFormData({ name: "", email: "diamondhome2026@gmail.com", password: "", role: "staff", permissions: initialPermissions });
              setModalOpen(true);
            }}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 20px", borderRadius: 10, border: "none",
              background: "linear-gradient(135deg, #2C1810, #5C3D2E)",
              color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer",
              boxShadow: "0 4px 16px rgba(44,24,16,0.2)"
            }}
          >
            <Plus size={17} /> Add User
          </motion.button>
        )}
      </motion.div>

      {/* Users table */}
      <div className="table-wrapper">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th className="th">#</th>
              <th className="th">User</th>
              <th className="th text-center">Role</th>
              <th className="th text-center">Status</th>
              <th className="th text-right">Actions</th>
            </tr>
          </thead>
          <tbody style={{ borderColor: "#F0EAE3" }}>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "64px 0" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                    <Users size={36} color="#E5DDD5" />
                    <p style={{ color: "#A89080", fontSize: 14, margin: 0 }}>No users found</p>
                  </div>
                </td>
              </tr>
            ) : (
              users.map((user, idx) => (
                <motion.tr
                  key={user._id}
                  className="tr-hover"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  style={{ borderBottom: "1px solid #F0EAE3" }}
                >
                  <td className="td" style={{ color: "#A89080", fontWeight: 600, fontSize: 12 }}>
                    {idx + 1}
                  </td>
                  <td className="td">
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: "50%",
                        background: "linear-gradient(135deg, #C9A84C, #E8C97A)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 15, fontWeight: 800, color: "#1A0F0A", flexShrink: 0
                      }}>
                        {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: "#1A1210", fontSize: 14 }}>
                          {user.name || "N/A"}
                        </div>
                        <div style={{ fontSize: 12, color: "#A89080", fontFamily: "monospace" }}>
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="td" style={{ textAlign: "center" }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", padding: "3px 12px",
                      borderRadius: 20, fontSize: 11, fontWeight: 700,
                      textTransform: "uppercase", letterSpacing: "0.05em",
                      background: (user.role || "staff") === "admin" ? "#FEF5E7" : "#EBF5FB",
                      color: (user.role || "staff") === "admin" ? "#CA6F1E" : "#2980B9",
                      border: `1px solid ${(user.role || "staff") === "admin" ? "#FAD7A0" : "#AED6F1"}`
                    }}>
                      {user.role || "staff"}
                    </span>
                  </td>
                  <td className="td" style={{ textAlign: "center" }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                      background: user.isActive !== false ? "#EAFAF1" : "#FDEDEC",
                      color: user.isActive !== false ? "#1E8449" : "#C0392B",
                      border: `1px solid ${user.isActive !== false ? "#A9DFBF" : "#F5B7B1"}`
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
                      {user.isActive !== false ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="td" style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                      {canEdit && (
                        <button
                          onClick={() => {
                            setEditingUser(user);
                            setFormData({
                              name: user.name || "",
                              email: user.email,
                              password: "",
                              role: user.role || "staff",
                              permissions: (user.permissions as IUserPermissions) || initialPermissions
                            });
                            setModalOpen(true);
                          }}
                          style={{
                            padding: "6px 10px", borderRadius: 8,
                            border: "1px solid #E5DDD5", background: "#fff",
                            cursor: "pointer", color: "#7A6055", fontSize: 13, fontWeight: 500,
                            display: "flex", alignItems: "center", gap: 5, transition: "all 0.15s"
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#EBF5FB"; (e.currentTarget as HTMLElement).style.color = "#2980B9"; (e.currentTarget as HTMLElement).style.borderColor = "#AED6F1"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#fff"; (e.currentTarget as HTMLElement).style.color = "#7A6055"; (e.currentTarget as HTMLElement).style.borderColor = "#E5DDD5"; }}
                        >
                          <Edit2 size={13} /> Edit
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => setDeleteId(user._id)}
                          style={{
                            padding: "6px 10px", borderRadius: 8,
                            border: "1px solid #E5DDD5", background: "#fff",
                            cursor: "pointer", color: "#7A6055", fontSize: 13, fontWeight: 500,
                            display: "flex", alignItems: "center", gap: 5, transition: "all 0.15s"
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#FDEDEC"; (e.currentTarget as HTMLElement).style.color = "#C0392B"; (e.currentTarget as HTMLElement).style.borderColor = "#F5B7B1"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#fff"; (e.currentTarget as HTMLElement).style.color = "#7A6055"; (e.currentTarget as HTMLElement).style.borderColor = "#E5DDD5"; }}
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingUser ? "Edit Worker" : "Add New Worker"}
        size="xl"
      >
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Basic info */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Input
              label="Full Name"
              value={formData.name}
              onChange={e => {
                setFormData({ ...formData, name: e.target.value });
                if (formErrors.name) setFormErrors({ ...formErrors, name: "" });
              }}
              error={formErrors.name}
            />
            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              readOnly={true}
              style={{ background: "#F5F2EA", opacity: 0.8 }}
            />
            <div style={{ position: "relative" }}>
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={e => {
                  setFormData({ ...formData, password: e.target.value });
                  if (formErrors.password) setFormErrors({ ...formErrors, password: "" });
                }}
                error={formErrors.password}
                hint={editingUser ? "Leave blank to keep current password" : ""}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute", right: 12, top: 38,
                  background: "none", border: "none", cursor: "pointer",
                  color: "#A89080", display: "flex", alignItems: "center"
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#5A4035", display: "block", marginBottom: 6, letterSpacing: "0.04em" }}>
                ROLE
              </label>
              <div style={{ display: "flex", gap: 10 }}>
                {(["staff", "admin"] as const).map(role => (
                  <label
                    key={role}
                    style={{
                      flex: 1, display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 14px", borderRadius: 10, cursor: "pointer",
                      border: `1.5px solid ${formData.role === role ? (role === "admin" ? "#FAD7A0" : "#AED6F1") : "#E5DDD5"}`,
                      background: formData.role === role ? (role === "admin" ? "#FEF5E7" : "#EBF5FB") : "#FAF8F6",
                      transition: "all 0.15s"
                    }}
                  >
                    <input
                      type="radio"
                      value={role}
                      checked={formData.role === role}
                      onChange={() => setFormData({ ...formData, role })}
                      style={{ display: "none" }}
                    />
                    <div style={{
                      width: 16, height: 16, borderRadius: "50%",
                      border: `2px solid ${formData.role === role ? (role === "admin" ? "#CA6F1E" : "#2980B9") : "#D5C8BF"}`,
                      background: formData.role === role ? (role === "admin" ? "#CA6F1E" : "#2980B9") : "transparent",
                      flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                      {formData.role === role && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
                    </div>
                    <span style={{
                      fontSize: 13, fontWeight: 600, textTransform: "capitalize",
                      color: formData.role === role ? (role === "admin" ? "#CA6F1E" : "#2980B9") : "#7A6055"
                    }}>
                      {role}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div style={{ borderTop: "1px solid #F0EAE3", paddingTop: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: "#FEF5E7", border: "1px solid #FAD7A0",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <Shield size={16} color="#CA6F1E" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1A1210" }}>Module Permissions</h3>
                <p style={{ margin: 0, fontSize: 12, color: "#A89080" }}>Control what each user can access and do</p>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {PAGES.map(page => {
                const pagePerms = (formData.permissions[page.id] as any) || { view: false, create: false, edit: false, delete: false };
                const isAllChecked = ACTIONS.every(a => pagePerms[a]);
                const isAnyChecked = ACTIONS.some(a => pagePerms[a]);

                return (
                  <div
                    key={page.id}
                    style={{
                      display: "flex", flexDirection: "row", alignItems: "center",
                      justifyContent: "space-between", flexWrap: "wrap", gap: 12,
                      padding: "12px 16px", borderRadius: 12,
                      background: isAnyChecked ? "#FBF9F7" : "#FAF8F6",
                      border: `1px solid ${isAnyChecked ? "#E5DDD5" : "#F0EAE3"}`,
                      transition: "all 0.15s"
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", userSelect: "none" }}
                      onClick={() => {
                        const newPerms = { ...formData.permissions };
                        const targetVal = !isAllChecked;
                        (newPerms as any)[page.id] = { view: targetVal, create: targetVal, edit: targetVal, delete: targetVal };
                        setFormData({ ...formData, permissions: newPerms });
                      }}
                    >
                      <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: isAnyChecked ? "#FEF5E7" : "#F0EAE3",
                        border: `1px solid ${isAnyChecked ? "#FAD7A0" : "#E5DDD5"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.15s"
                      }}>
                        <page.icon size={16} color={isAnyChecked ? "#CA6F1E" : "#A89080"} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: isAnyChecked ? "#1A1210" : "#7A6055" }}>
                        {page.label}
                      </span>
                      {/* Master toggle checkbox */}
                      <div style={{
                        width: 18, height: 18, borderRadius: 5,
                        border: `2px solid ${isAllChecked ? "#CA6F1E" : "#D5C8BF"}`,
                        background: isAllChecked ? "#CA6F1E" : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.15s"
                      }}>
                        {isAllChecked && <span style={{ color: "#fff", fontSize: 11, fontWeight: 900 }}>✓</span>}
                        {!isAllChecked && isAnyChecked && <span style={{ color: "#D5C8BF", fontSize: 11, fontWeight: 900 }}>–</span>}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                      {ACTIONS.map(action => (
                        <label
                          key={action}
                          style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}
                        >
                          <div
                            onClick={() => {
                              const newPerms = { ...formData.permissions };
                              const pPerms = { ...(newPerms[page.id] || { view: false, create: false, edit: false, delete: false }) };
                              (pPerms as any)[action] = !(pPerms as any)[action];
                              (newPerms as any)[page.id] = pPerms;
                              setFormData({ ...formData, permissions: newPerms });
                            }}
                            style={{
                              width: 16, height: 16, borderRadius: 4,
                              border: `1.5px solid ${!!(pagePerms[action]) ? "#CA6F1E" : "#D5C8BF"}`,
                              background: !!(pagePerms[action]) ? "#CA6F1E" : "transparent",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              cursor: "pointer", transition: "all 0.15s"
                            }}
                          >
                            {!!(pagePerms[action]) && <span style={{ color: "#fff", fontSize: 10, fontWeight: 900 }}>✓</span>}
                          </div>
                          <span style={{ fontSize: 12, color: !!(pagePerms[action]) ? "#1A1210" : "#A89080", fontWeight: !!(pagePerms[action]) ? 600 : 400, textTransform: "capitalize" }}>
                            {action}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, borderTop: "1px solid #F0EAE3", paddingTop: 16 }}>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              style={{
                padding: "10px 20px", borderRadius: 10, border: "1.5px solid #E5DDD5",
                background: "#fff", fontSize: 14, fontWeight: 600, color: "#7A6055", cursor: "pointer"
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: "10px 24px", borderRadius: 10, border: "none",
                background: "linear-gradient(135deg, #2C1810, #5C3D2E)",
                fontSize: 14, fontWeight: 700, color: "#fff", cursor: "pointer",
                boxShadow: "0 4px 14px rgba(44,24,16,0.2)"
              }}
            >
              {editingUser ? "Update Worker" : "Create Worker"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Worker"
        message="Are you sure you want to delete this worker? This action cannot be undone."
        confirmLabel="Delete"
        loading={deleting}
      />

      <ConfirmModal
        open={createConfirmOpen}
        title={editingUser ? "Update Worker?" : "Create New Worker?"}
        message={editingUser 
          ? `Are you sure you want to update permissions for ${formData.name}?` 
          : `This will create a new account for ${formData.name} with the shared corporate email.`
        }
        onClose={() => setCreateConfirmOpen(false)}
        onConfirm={executeSubmit}
        confirmLabel={editingUser ? "Update" : "Create"}
      />
    </div>
  );
}
