import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SessionWrapper from "@/components/layout/SessionWrapper";
import Providers from "./Providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CAFE DIRECT",
  description: "Business management — sales, purchases, inventory",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, fontFamily: inter.style.fontFamily }}>
        <SessionWrapper session={session}>
          <Providers>
            {children}
          </Providers>
        </SessionWrapper>
      </body>
    </html>
  );
}