"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
    LayoutDashboard, Package, Users, ShoppingCart,
    TruckIcon, Briefcase, LogOut, ReceiptText, Hammer, 
    Database, ShoppingBag, Truck, Receipt, Settings, 
    FileText, Bell, User
} from "lucide-react";
import { useSession } from "next-auth/react";

const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/quotations", label: "Quotations", icon: FileText },
    { href: "/sales", label: "Sales", icon: ReceiptText },
    { href: "/production", label: "Production", icon: Hammer },
    { href: "/deliveries", label: "Delivery", icon: Truck },
    { href: "/invoices", label: "Invoice", icon: Receipt },
    { href: "/products", label: "Products", icon: Package },
    { href: "/customers", label: "Customers", icon: Users },
    { href: "/suppliers", label: "Suppliers", icon: TruckIcon },
    { href: "/materials", label: "Materials", icon: Database },
    { href: "/purchases", label: "Purchases", icon: ShoppingBag },
    { href: "/expenses", label: "Expenses", icon: Receipt },
    { href: "/settings", label: "Settings", icon: Settings },
];

export default function Navbar() {
    const { data: session } = useSession();
    const pathname = usePathname();

    return (
        <header className="bg-[#1A0F0A] text-[#E5DDD5] shadow-lg sticky top-0 z-50">
            {/* Top row: Logo and Profile */}
            <div className="max-w-[1600px] mx-auto px-4 h-16 flex items-center justify-between border-b border-[#2C1810]">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C9A84C] to-[#8B5E3C] flex items-center justify-center flex-shrink-0 shadow-lg">
                        <Briefcase size={20} color="#fff" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-extrabold text-lg text-[#E8C97A] leading-none tracking-tight">DIAMOND HOME</span>
                        <span className="text-[10px] text-white/40 font-semibold uppercase tracking-widest mt-1">Furniture ERP</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button className="p-2 text-[#7A6055] hover:bg-white/5 rounded-full transition-colors">
                        <Bell size={20} />
                    </button>
                    <div className="h-8 w-px bg-[#2C1810]"></div>
                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-semibold text-[#E8C97A] leading-none">{session?.user?.name}</p>
                            <p className="text-[10px] text-white/40 mt-1 uppercase tracking-wider">{session?.user?.role || 'Owner'}</p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#2C1810] to-[#5C3D2E] flex items-center justify-center text-white font-bold border-2 border-[#2C1810]">
                            {session?.user?.name?.[0] || <User size={20} />}
                        </div>
                        <button 
                            onClick={() => signOut({ callbackUrl: "/login" })}
                            className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-full transition-colors ml-2"
                            title="Logout"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom row: Navigation Links */}
            <div className="bg-[#1A0F0A] overflow-x-auto scrollbar-hide border-b border-[#2C1810]">
                <nav className="max-w-[1600px] mx-auto flex items-center px-2 py-1">
                    {navItems.map(({ href, label, icon: Icon }) => {
                        const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
                        return (
                            <Link 
                                key={href} 
                                href={href}
                                className={`
                                    flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap
                                    ${active 
                                        ? "bg-[#C9A84C]/10 text-[#E8C97A] border border-[#C9A84C]/20" 
                                        : "text-white/60 hover:text-[#E8C97A] hover:bg-white/5 border border-transparent"
                                    }
                                `}
                            >
                                <Icon size={18} className={active ? "text-[#E8C97A]" : "text-white/40"} />
                                <span>{label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </header>
    );
}
