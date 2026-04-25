"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import TopNav from "@/components/layout/TopNav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (!session && status !== "loading") return null;

  return (
    <div style={{ minHeight: "100vh", background: "#F7F4F0" }}>
      <TopNav />
      <main
        style={{ paddingTop: 64 }}
        className="min-h-screen"
      >
        <div className="max-w-screen-2xl mx-auto px-3 sm:px-4 md:px-6 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
