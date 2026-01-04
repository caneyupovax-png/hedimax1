"use client";
export const dynamic = "force-dynamic";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function EarnPage() {
  const router = useRouter();
  const supabase = createClient();
  const [toast, setToast] = useState("");
  const toastTimer = useRef<number | null>(null);

  const [notikOpen, setNotikOpen] = useState(false);
  const [notikUrl, setNotikUrl] = useState<string>("");
  const [notikLoading, setNotikLoading] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 2500);
  };

  const closeNotik = () => {
    setNotikOpen(false);
    setNotikUrl("");
    setNotikLoading(false);
  };

  const openNotik = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) { router.push("/login?next=/earn"); return; }
    setNotikOpen(true);
    setNotikLoading(true);
    const res = await fetch(`/api/offerwall/notik?user_id=${data.user.id}`);
    const json = await res.json().catch(() => ({} as any));
    if (json?.url) setNotikUrl(json.url);
    else { setNotikLoading(false); showToast(json?.error || "Failed to open Notik"); }
  };

  const openAdsWed = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) { router.push("/login?next=/earn"); return; }
    const url = `https://adswedmedia.com/offer/Pn0Zz9/${encodeURIComponent(data.user.id)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const openGemiWall = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) { router.push("/login?next=/earn"); return; }
    const placementId = process.env.NEXT_PUBLIC_GEMIWALL_PLACEMENT_ID;
    const url = `https://gemiwall.com/${encodeURIComponent(placementId || "")}/${encodeURIComponent(data.user.id)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-[#0d0e12] text-white selection:bg-[#2ecc71]/30">
      
      {/* Background Subtle Glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-5%] left-[10%] w-[300px] h-[300px] bg-[#2ecc71]/5 blur-[100px] rounded-full" />
      </div>

      {/* NOTIK MODAL */}
      {notikOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={closeNotik} />
          <div className="relative w-full max-w-5xl h-[80vh] rounded-2xl bg-[#16171d] border border-white/10 overflow-hidden shadow-2xl">
            <div className="h-12 px-6 flex items-center justify-between border-b border-white/5 bg-[#1a1c23]">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#2ecc71]">Notik Offerwall</span>
              <button onClick={closeNotik} className="text-xs hover:text-red-500 transition font-bold uppercase tracking-tighter">Close</button>
            </div>
            <div className="relative h-[calc(80vh-48px)] bg-white">
              {notikLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#16171d] text-[#2ecc71] text-xs font-bold uppercase tracking-widest">
                  Loading Offerwall...
                </div>
              )}
              {notikUrl && <iframe src={notikUrl} className="w-full h-full" onLoad={() => setNotikLoading(false)} />}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 py-10">
        
        {/* HEADER SECTION */}
        <div className="mb-10 border-b border-white/5 pb-6">
          <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none">
            EARN <span className="text-[#2ecc71]">COINS</span>
          </h1>
          <p className="text-white/30 text-xs mt-2 uppercase tracking-widest font-medium">
            Complete offers and earn rewards instantly.
          </p>
        </div>

        {/* PROVIDERS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          
          {/* CARD: NOTIK */}
          <div onClick={openNotik} className="group relative bg-[#16171d] rounded-2xl border border-white/5 hover:border-[#2ecc71]/40 transition-all duration-300 cursor-pointer p-4 overflow-hidden shadow-lg">
            <div className="relative w-full h-24 mb-4 rounded-xl bg-black/20 flex items-center justify-center overflow-hidden">
               <Image 
                  src="/partners/notik.png" 
                  alt="Notik" 
                  width={100}
                  height={40}
                  className="object-contain group-hover:scale-105 transition-transform"
               />
            </div>
            <div className="flex flex-col items-center text-center">
                <h3 className="text-sm font-black uppercase italic tracking-tight group-hover:text-[#2ecc71] transition-colors">Notik</h3>
                <p className="text-[10px] text-white/30 mt-1 mb-4 h-8 overflow-hidden">Mobile tasks & app downloads.</p>
                <div className="w-full py-2 rounded-lg bg-white/5 group-hover:bg-[#2ecc71] transition-colors text-[10px] font-black uppercase tracking-widest group-hover:text-black">
                   OPEN
                </div>
            </div>
          </div>

          {/* CARD: ADSWED */}
          <div onClick={openAdsWed} className="group relative bg-[#16171d] rounded-2xl border border-white/5 hover:border-[#2ecc71]/40 transition-all duration-300 cursor-pointer p-4 overflow-hidden shadow-lg">
            <div className="relative w-full h-24 mb-4 rounded-xl bg-black/20 flex items-center justify-center overflow-hidden">
               <Image 
                  src="/partners/adswed.png" 
                  alt="AdsWed" 
                  width={100}
                  height={40}
                  className="object-contain group-hover:scale-105 transition-transform"
               />
            </div>
            <div className="flex flex-col items-center text-center">
                <h3 className="text-sm font-black uppercase italic tracking-tight group-hover:text-[#2ecc71] transition-colors">AdsWed</h3>
                <p className="text-[10px] text-white/30 mt-1 mb-4 h-8 overflow-hidden">Surveys & premium registrations.</p>
                <div className="w-full py-2 rounded-lg bg-white/5 group-hover:bg-[#2ecc71] transition-colors text-[10px] font-black uppercase tracking-widest group-hover:text-black">
                   OPEN
                </div>
            </div>
          </div>

          {/* CARD: GEMIWALL */}
          <div onClick={openGemiWall} className="group relative bg-[#16171d] rounded-2xl border border-white/5 hover:border-[#2ecc71]/40 transition-all duration-300 cursor-pointer p-4 overflow-hidden shadow-lg">
            <div className="relative w-full h-24 mb-4 rounded-xl bg-black/20 flex items-center justify-center overflow-hidden">
               <Image 
                  src="/partners/gemiwall.png" 
                  alt="GemiWall" 
                  width={100}
                  height={40}
                  className="object-contain group-hover:scale-105 transition-transform"
               />
            </div>
            <div className="flex flex-col items-center text-center">
                <h3 className="text-sm font-black uppercase italic tracking-tight group-hover:text-[#2ecc71] transition-colors">GemiWall</h3>
                <p className="text-[10px] text-white/30 mt-1 mb-4 h-8 overflow-hidden">Fast approved simple web offers.</p>
                <div className="w-full py-2 rounded-lg bg-white/5 group-hover:bg-[#2ecc71] transition-colors text-[10px] font-black uppercase tracking-widest group-hover:text-black">
                   OPEN
                </div>
            </div>
          </div>

        </div>

        {/* Live Feed - Professional Subtle Version */}
        <div className="mt-12 p-4 bg-[#16171d] rounded-2xl border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <span className="flex h-2 w-2 rounded-full bg-[#2ecc71] animate-pulse"></span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Network Status: Active</span>
            </div>
            <div className="flex gap-6 overflow-hidden">
                <span className="text-[10px] text-white/20 italic tracking-tighter">Mert*** +500 C</span>
                <span className="text-[10px] text-white/20 italic tracking-tighter">Can*** +1200 C</span>
                <span className="hidden sm:block text-[10px] text-white/20 italic tracking-tighter">Heidi*** +45 C</span>
                <meta name="google-adsense-account" content="ca-pub-8882655723474087">
            </div>
        </div>

      </div>
    </div>
  );
}