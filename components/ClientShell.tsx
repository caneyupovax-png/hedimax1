"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Navbar from "./Navbar";
import AuthModal from "./AuthModal";

type Mode = "login" | "register";

function buildUrl(pathname: string, params: URLSearchParams) {
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export default function ClientShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<Mode>("login");

  useEffect(() => {
    const a = searchParams.get("auth");
    if (a === "login" || a === "register") {
      setAuthMode(a);
      setAuthOpen(true);
    } else {
      setAuthOpen(false);
    }
  }, [searchParams]);

  const openAuth = (mode: Mode) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("auth", mode);
    router.push(buildUrl(pathname, params), { scroll: false });
  };

  const closeAuth = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("auth");
    router.replace(buildUrl(pathname, params), { scroll: false });
    setAuthOpen(false);
  };

  return (
    <>
      <Navbar
        onOpenLogin={() => openAuth("login")}
        onOpenRegister={() => openAuth("register")}
      />

      <AuthModal
        open={authOpen}
        mode={authMode}
        onClose={closeAuth}
        onModeChange={(m) => openAuth(m)}
      />

      {/* 🔥 ARTIK SITE FULL WIDTH */}
      <main className="min-h-[calc(100vh-64px)] w-full">
        <div key={pathname} className="page-transition w-full">
          {children}
        </div>
      </main>
    </>
  );
}
