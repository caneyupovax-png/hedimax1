import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const ALLOWED = new Set(["BTC", "LTC", "DOGE"]);

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Supabase env missing");
  }

  return { url, key };
}

export async function POST(req: Request) {
  try {
    /* -------------------------------------------------------
       1) AUTH HEADER → ACCESS TOKEN
    ------------------------------------------------------- */
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.replace("Bearer ", "").trim()
      : "";

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { url, key } = getSupabase();

    /* -------------------------------------------------------
       2) JWT’Lİ (AUTHED) SUPABASE CLIENT
       → RLS + auth.uid() çalışır
    ------------------------------------------------------- */
    const supabase = createClient(url, key, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    /* -------------------------------------------------------
       3) TOKEN GEÇERLİ Mİ?
    ------------------------------------------------------- */
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    /* -------------------------------------------------------
       4) BODY VALIDATION
    ------------------------------------------------------- */
    const body = await req.json().catch(() => null);

    const coin = String(body?.coin || "").toUpperCase();
    const address = String(body?.address || "").trim();
    const amount = Math.floor(Number(body?.amount)); // PUAN = INTEGER

    if (!ALLOWED.has(coin)) {
      return NextResponse.json({ error: "Invalid coin" }, { status: 400 });
    }

    if (!address || address.length < 8) {
      return NextResponse.json({ error: "Invalid address" }, { status: 400 });
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    /* -------------------------------------------------------
       5) ATOMİK ÇEKİM (RPC)
       → puan kontrol
       → puan düş
       → withdrawal aç
    ------------------------------------------------------- */
    const { data, error } = await supabase.rpc("request_withdrawal", {
      p_coin: coin,
      p_address: address,
      p_amount: amount,
    });

    if (error) {
      let msg = error.message;

      if (msg.includes("insufficient_points")) {
        msg = "Insufficient points.";
      } else if (msg.includes("profile_not_found")) {
        msg = "Profile not found.";
      } else if (msg.includes("invalid_amount")) {
        msg = "Invalid amount.";
      }

      return NextResponse.json({ error: msg }, { status: 400 });
    }

    /* -------------------------------------------------------
       6) SUCCESS
    ------------------------------------------------------- */
    return NextResponse.json(
      { ok: true, withdrawal_id: data },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
