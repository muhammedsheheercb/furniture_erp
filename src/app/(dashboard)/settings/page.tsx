import { 
  Settings, 
  Store, 
  Lock, 
  Bell, 
  Shield, 
  CreditCard,
  Save,
  Globe
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

export default async function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-extrabold text-[#1A1210]">Settings</h2>
        <p className="text-[#7A6055]">Configure your shop profile, taxes and security.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-4">
          <nav className="flex flex-col gap-1">
            <Button variant="ghost" className="justify-start bg-[#FAF8F6] text-[#C9A84C] font-bold">
              <Store size={18} className="mr-3" /> Shop Profile
            </Button>
            <Button variant="ghost" className="justify-start text-[#7A6055] hover:bg-[#FAF8F6]">
              <Globe size={18} className="mr-3" /> Taxes & Invoicing
            </Button>
            <Button variant="ghost" className="justify-start text-[#7A6055] hover:bg-[#FAF8F6]">
              <Lock size={18} className="mr-3" /> Change Password
            </Button>
          </nav>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card className="border-[#E5DDD5]">
            <CardHeader>
              <CardTitle>Shop Details</CardTitle>
              <CardDescription>This information will appear on your quotations and invoices.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Shop Name</Label>
                  <Input defaultValue="Diamond Home Furniture" className="border-[#E5DDD5]" />
                </div>
                <div className="space-y-2">
                  <Label>GSTIN</Label>
                  <Input defaultValue="27AAAAA0000A1Z5" className="border-[#E5DDD5]" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Business Address</Label>
                <Input defaultValue="Survey No 45, Industrial Estate, Hubli, Karnataka" className="border-[#E5DDD5]" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input defaultValue="+91 98765 43210" className="border-[#E5DDD5]" />
                </div>
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input defaultValue="contact@diamondhome.com" className="border-[#E5DDD5]" />
                </div>
              </div>
              <div className="pt-4">
                <Button className="bg-[#2C1810] text-white hover:bg-[#1A0F0A]">
                  <Save size={18} className="mr-2" /> Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#E5DDD5]">
            <CardHeader>
              <CardTitle>Invoice Configuration</CardTitle>
              <CardDescription>Prefixes and starting numbers for documents.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Quotation Prefix</Label>
                  <Input defaultValue="QT-" className="border-[#E5DDD5]" />
                </div>
                <div className="space-y-2">
                  <Label>Order Prefix</Label>
                  <Input defaultValue="SO-" className="border-[#E5DDD5]" />
                </div>
                <div className="space-y-2">
                  <Label>Invoice Prefix</Label>
                  <Input defaultValue="INV-" className="border-[#E5DDD5]" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tax Rate (GST %)</Label>
                <Input type="number" defaultValue="18" className="border-[#E5DDD5]" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
