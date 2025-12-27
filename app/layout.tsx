import "./globals.css";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Hedimax | Earn & Cashout",
  description: "Earn rewards and cash out fast with Hedimax.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-emerald-950 via-slate-950 to-black text-white antialiased">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
