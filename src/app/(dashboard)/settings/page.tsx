"use client";

import { 
  Store, 
  Lock, 
  Save, 
  Globe,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("shop");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    shopName: "",
    gstin: "",
    address: "",
    phone: "",
    email: "",
    quotationPrefix: "",
    orderPrefix: "",
    invoicePrefix: "",
    taxRate: 18,
    currencySymbol: "₹",
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await axios.get("/api/settings");
      if (res.data.success) {
        setSettings(res.data.data);
      }
    } catch (err) {
      console.error("Settings fetch error:", err);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await axios.post("/api/settings", settings);
      if (res.data.success) {
        toast.success("Settings saved successfully");
      }
    } catch (err) {
      console.error("Settings save error:", err);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordData.newPassword) return toast.error("Password cannot be empty");
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return toast.error("Passwords do not match");
    }

    setSaving(true);
    try {
      const res = await axios.put(`/api/users/${session?.user?.id}`, {
        password: passwordData.newPassword
      });
      if (res.data.success) {
        toast.success("Password updated successfully");
        setPasswordData({ newPassword: "", confirmPassword: "" });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update password");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin h-12 w-12 text-[#C9A84C]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-[#1A1210] tracking-tight">Settings</h2>
          <p className="text-[#7A6055] mt-1">Configure your shop profile, taxes and security.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <Card className="border-[#E5DDD5] shadow-sm overflow-hidden sticky top-24">
            <nav className="flex flex-col p-2">
              <button 
                onClick={() => setActiveTab("shop")}
                className={`flex items-center px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeTab === "shop" 
                    ? "bg-[#2C1810] text-white shadow-md" 
                    : "text-[#7A6055] hover:bg-[#FAF8F6]"
                }`}
              >
                <Store size={18} className="mr-3" /> Shop Profile
              </button>
              <button 
                onClick={() => setActiveTab("taxes")}
                className={`flex items-center px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeTab === "taxes" 
                    ? "bg-[#2C1810] text-white shadow-md" 
                    : "text-[#7A6055] hover:bg-[#FAF8F6]"
                }`}
              >
                <Globe size={18} className="mr-3" /> Taxes & Invoicing
              </button>
              <button 
                onClick={() => setActiveTab("password")}
                className={`flex items-center px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeTab === "password" 
                    ? "bg-[#2C1810] text-white shadow-md" 
                    : "text-[#7A6055] hover:bg-[#FAF8F6]"
                }`}
              >
                <Lock size={18} className="mr-3" /> Change Password
              </button>
            </nav>
          </Card>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {activeTab === "shop" && (
              <motion.div 
                key="shop"
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="border-[#E5DDD5] shadow-lg overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-white to-[#FAF8F6] border-b border-[#F0EBE6]">
                    <CardTitle className="text-[#1A1210]">Shop Details</CardTitle>
                    <CardDescription>This information will appear on your quotations and invoices.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <form onSubmit={handleSaveSettings} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-[#1A1210] font-semibold">Shop Name</Label>
                          <Input 
                            value={settings.shopName} 
                            onChange={(e) => setSettings({...settings, shopName: e.target.value})}
                            placeholder="Diamond Home Furniture" 
                            className="border-[#E5DDD5] focus:ring-[#C9A84C]" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[#1A1210] font-semibold">GSTIN</Label>
                          <Input 
                            value={settings.gstin} 
                            onChange={(e) => setSettings({...settings, gstin: e.target.value})}
                            placeholder="27AAAAA0000A1Z5" 
                            className="border-[#E5DDD5] focus:ring-[#C9A84C]" 
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-[#1A1210] font-semibold">Business Address</Label>
                        <Input 
                          value={settings.address} 
                          onChange={(e) => setSettings({...settings, address: e.target.value})}
                          placeholder="Industrial Estate, Karnataka" 
                          className="border-[#E5DDD5] focus:ring-[#C9A84C]" 
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-[#1A1210] font-semibold">Phone Number</Label>
                          <Input 
                            value={settings.phone} 
                            onChange={(e) => setSettings({...settings, phone: e.target.value})}
                            placeholder="+91 98765 43210" 
                            className="border-[#E5DDD5] focus:ring-[#C9A84C]" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[#1A1210] font-semibold">Email Address</Label>
                          <Input 
                            value={settings.email} 
                            onChange={(e) => setSettings({...settings, email: e.target.value})}
                            placeholder="contact@diamondhome.com" 
                            className="border-[#E5DDD5] focus:ring-[#C9A84C]" 
                          />
                        </div>
                      </div>

                      <div className="pt-4 flex justify-end">
                        <Button 
                          type="submit" 
                          disabled={saving}
                          className="bg-[#C9A84C] hover:bg-[#B8973B] text-white px-8 h-11 rounded-xl shadow-lg shadow-[#C9A84C]/20"
                        >
                          {saving ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save size={18} className="mr-2" />}
                          Save Shop Profile
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === "taxes" && (
              <motion.div 
                key="taxes"
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="border-[#E5DDD5] shadow-lg overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-white to-[#FAF8F6] border-b border-[#F0EBE6]">
                    <CardTitle className="text-[#1A1210]">Invoice & Tax Configuration</CardTitle>
                    <CardDescription>Prefixes and starting numbers for documents.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <form onSubmit={handleSaveSettings} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <Label className="text-[#1A1210] font-semibold">Quotation Prefix</Label>
                          <Input 
                            value={settings.quotationPrefix} 
                            onChange={(e) => setSettings({...settings, quotationPrefix: e.target.value})}
                            placeholder="QT-" 
                            className="border-[#E5DDD5] focus:ring-[#C9A84C]" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[#1A1210] font-semibold">Order Prefix</Label>
                          <Input 
                            value={settings.orderPrefix} 
                            onChange={(e) => setSettings({...settings, orderPrefix: e.target.value})}
                            placeholder="SO-" 
                            className="border-[#E5DDD5] focus:ring-[#C9A84C]" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[#1A1210] font-semibold">Invoice Prefix</Label>
                          <Input 
                            value={settings.invoicePrefix} 
                            onChange={(e) => setSettings({...settings, invoicePrefix: e.target.value})}
                            placeholder="INV-" 
                            className="border-[#E5DDD5] focus:ring-[#C9A84C]" 
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-[#1A1210] font-semibold">Tax Rate (GST %)</Label>
                          <Input 
                            type="number" 
                            value={settings.taxRate} 
                            onChange={(e) => setSettings({...settings, taxRate: parseFloat(e.target.value)})}
                            className="border-[#E5DDD5] focus:ring-[#C9A84C]" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[#1A1210] font-semibold">Currency Symbol</Label>
                          <Input 
                            value={settings.currencySymbol} 
                            onChange={(e) => setSettings({...settings, currencySymbol: e.target.value})}
                            className="border-[#E5DDD5] focus:ring-[#C9A84C]" 
                          />
                        </div>
                      </div>

                      <div className="pt-4 flex justify-end">
                        <Button 
                          type="submit" 
                          disabled={saving}
                          className="bg-[#C9A84C] hover:bg-[#B8973B] text-white px-8 h-11 rounded-xl shadow-lg shadow-[#C9A84C]/20"
                        >
                          {saving ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save size={18} className="mr-2" />}
                          Save Invoice Settings
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === "password" && (
              <motion.div 
                key="password"
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="border-[#E5DDD5] shadow-lg overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-white to-[#FAF8F6] border-b border-[#F0EBE6]">
                    <CardTitle className="text-[#1A1210]">Security Settings</CardTitle>
                    <CardDescription>Update your account password regularly to stay secure.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <form onSubmit={handleChangePassword} className="space-y-6">
                      <div className="max-w-md space-y-4">
                        <div className="space-y-2">
                          <Label className="text-[#1A1210] font-semibold">New Password</Label>
                          <Input 
                            type="password" 
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                            placeholder="••••••••" 
                            className="border-[#E5DDD5] focus:ring-[#C9A84C]" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[#1A1210] font-semibold">Confirm New Password</Label>
                          <Input 
                            type="password" 
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                            placeholder="••••••••" 
                            className="border-[#E5DDD5] focus:ring-[#C9A84C]" 
                          />
                        </div>
                      </div>

                      <div className="pt-4 flex justify-end">
                        <Button 
                          type="submit" 
                          disabled={saving}
                          className="bg-[#2C1810] hover:bg-[#1A0F0A] text-white px-8 h-11 rounded-xl shadow-lg"
                        >
                          {saving ? <Loader2 className="animate-spin mr-2" size={18} /> : <CheckCircle2 size={18} className="mr-2" />}
                          Update Password
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
