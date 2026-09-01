"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Navbar from "@/components/layout/Navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  console.log("[DashboardLayout] Session Status:", status, !!session);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[var(--bg)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg)] font-sans">
      <Navbar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 scroll-smooth overflow-y-auto">
          <div className="max-w-[1600px] mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
