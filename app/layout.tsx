import "./globals.css";
import type { Metadata } from "next";
import ClientShell from "@/components/ClientShell";
import Footer from "@/components/Footer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Hedimax",
  description: "Earn rewards • Cash out fast",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className="
          bg-black text-white
          overflow-x-hidden
          overscroll-x-none
        "
        suppressHydrationWarning
      >
        <ClientShell>
          <div className="min-h-screen flex flex-col">
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </ClientShell>
      </body>
    </html>
  );
}
