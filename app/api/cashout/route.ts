// app/api/cashout/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(req: Request) {
  try {
    // ENV kontrol
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { error: "Server misconfigured: missing Supabase env" },
        { status: 500 }
      );
    }

    // Authorization header kontrol
    const auth = req.headers.get("authorization") || "";
    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized: missing token" },
        { status: 401 }
      );
    }

    if (!auth.toLowerCase().startsWith("bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized: bad auth header" },
        { status: 401 }
      );
    }

    const token = auth.slice("Bearer ".length).trim();
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: missing token" },
        { status: 401 }
      );
    }

    // Body
    const body = await req.json().catch(() => null);
    const { coin, address, amount } = body || {};

    if (!coin || !address || typeof amount !== "number") {
      return NextResponse.json(
        { error: "Bad Request: coin/address/amount required" },
        { status: 400 }
      );
    }

    // Authed client (user token ile)
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const { data, error } = await supabase.rpc("request_withdrawal", {
      p_coin: coin,
      p_address: address,
      p_amount: amount,
    });

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
