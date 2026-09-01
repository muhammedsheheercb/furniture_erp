import type { Metadata } from "next";
import { Inter, Noto_Sans_Arabic } from "next/font/google";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SessionWrapper from "@/components/layout/SessionWrapper";
import Providers from "./Providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const notoSansArabic = Noto_Sans_Arabic({ subsets: ["arabic"], variable: "--font-arabic" });

export const metadata: Metadata = {
  title: "Diamond Home",
  description:
    "Diamond Home — Premium Furniture Store & ERP. Manage sales, inventory, customers, purchases, and production all in one place.",
  icons: {
    icon: "/images/logo.webp",
    apple: "/images/logo.webp",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${notoSansArabic.variable}`}
        style={{ margin: 0, padding: 0 }}
      >
        <SessionWrapper session={session}>
          <Providers>{children}</Providers>
        </SessionWrapper>
      </body>
    </html>
  );
}
