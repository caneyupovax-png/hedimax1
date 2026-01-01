import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function toInt(v: string | null) {
  const n = v ? Number(v) : NaN;
  return Number.isFinite(n) ? Math.floor(n) : null;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  // Panelde makro isimleri farklı olabilir; gerekirse ekleriz
  const userId = searchParams.get("user_id") || searchParams.get("userId") || "";
  const amount = toInt(searchParams.get("amount") || searchParams.get("AMOUNT") || searchParams.get("reward"));
  const txid =
    searchParams.get("transaction_id") ||
    searchParams.get("transactionId") ||
    searchParams.get("txid") ||
    "";

  if (!userId || amount === null || amount <= 0) {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  // ✅ Eğer transaction_id yoksa testte sorun değil, ama üretimde olmalı
  // (Duplicate engeli için). Şimdilik zorunlu yapmıyorum.
  // İstersen zorunlu yaparız:
  // if (!txid) return NextResponse.json({ ok:false, error:"missing_txid" }, { status:400 });

  // points_balance tablosunda en doğru kolon genelde user_id
  const { data: row, error: readErr } = await supabaseAdmin
    .from("points_balance")
    .select("balance")
    .eq("user_id", userId)
    .maybeSingle();

  if (readErr) {
    return NextResponse.json({ ok: false, error: readErr.message }, { status: 500 });
  }

  const current = Math.floor(Number((row as any)?.balance || 0));
  const next = current + amount;

  const { error: upErr } = await supabaseAdmin
    .from("points_balance")
    .upsert({ user_id: userId, balance: next }, { onConflict: "user_id" });

  if (upErr) {
    return NextResponse.json({ ok: false, error: upErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, user_id: userId, added: amount, balance: next, txid });
}
