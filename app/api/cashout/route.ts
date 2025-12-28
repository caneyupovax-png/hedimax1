// app/api/cashout/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs"; // prod/edge farkını elimine etmek için

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Admin client sadece token doğrulamak için (RLS bypass etmemek için işlemde kullanmıyoruz)
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req: Request) {
  try {
    // 0) ENV kontrolü (Vercel’de yanlış env çok yaygın)
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return NextResponse.json(
        {
          error:
            "Server misconfigured: missing SUPABASE_URL / SUPABASE_ANON_KEY",
        },
        { status: 500 }
      );
    }

    // 1) Authorization header’dan Bearer token çek
    const auth = req.headers.get("authorization") || "";
    const match = auth.match(/^Bearer\s+(.+)$/i);
    const token = match?.[1];

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: missing token" },
        { status: 401 }
      );
    }

    // 2) Token geçerli mi? (Invalid token ayrımı)
    // Service role varsa: auth.getUser(token) ile doğrula.
    // Yoksa: anon client ile de doğrulayabiliriz (çoğu projede çalışır).
    if (SUPABASE_SERVICE_ROLE_KEY) {
      const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const { data, error } = await admin.auth.getUser(token);
      if (error || !data?.user) {
        return NextResponse.json(
          { error: "Unauthorized: invalid token" },
          { status: 401 }
        );
      }
    } else {
      // Service role yoksa fallback doğrulama (daha zayıf ama ayrım için yeterli)
      const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data, error } = await anon.auth.getUser(token);
      if (error || !data?.user) {
        return NextResponse.json(
          { error: "Unauthorized: invalid token" },
          { status: 401 }
        );
      }
    }

    // 3) Body al
    const body = await req.json().catch(() => null);
    const { coin, address, amount } = body || {};

    if (!coin || !address || typeof amount !== "number") {
      return NextResponse.json(
        { error: "Bad Request: coin/address/amount required" },
        { status: 400 }
      );
    }

    // 4) Authed Supabase client: token’ı global header ile geçir
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // 5) RPC çağır
    const { data, error } = await supabase.rpc("request_withdrawal", {
      p_coin: coin,
      p_address: address,
      p_amount: amount,
    });

    if (error) {
      // Buraya düşerse artık "token yok/invalid" değil → genelde RLS/policy veya function error
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
