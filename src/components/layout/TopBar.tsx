"use client";
import { useSession } from "next-auth/react";

interface TopBarProps {
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
}

export default function TopBar({ title, subtitle, actions }: TopBarProps) {
    const { data: session } = useSession();

    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{title}</h1>
                {subtitle && <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{subtitle}</p>}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    {actions}
                </div>
                <div className="flex items-center gap-2 ml-2 hidden sm:flex">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-semibold">
                        {session?.user?.email?.[0]?.toUpperCase() ?? "U"}
                    </div>
                    <span className="text-sm text-gray-600 hidden sm:block">{session?.user?.email}</span>
                </div>
            </div>
        </div>
    );
}