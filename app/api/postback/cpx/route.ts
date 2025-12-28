import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const USD_TO_COINS = 1000;

function md5(s: string) {
  return crypto.createHash("md5").update(s).digest("hex");
}

function ok() {
  return new Response("OK", { status: 200 });
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = url.searchParams;

  const status = q.get("status"); // "1" completed, "2" canceled
  const trans_id = q.get("trans_id") || "";
  const subid_1 = q.get("subid_1") || ""; // your user uuid
  const amount_usd_str = q.get("amount_usd") || "0";
  const hash = (q.get("hash") || "").toLowerCase();
  const type = q.get("type") || "";

  // parametre yoksa bile OK (CPX testleri için)
  if (!trans_id || !subid_1) return ok();

  // sadece completed kredi
  if (status !== "1") return ok();

  const amount_usd = Number(amount_usd_str);
  if (!Number.isFinite(amount_usd) || amount_usd <= 0) return ok();

  // hash doğrulama: md5("{trans_id}-{yourappsecurehash}")
  const secret = process.env.CPX_APP_SECURE_HASH || "";
  if (!secret) return ok();

  const expected = md5(`${trans_id}-${secret}`).toLowerCase();
  if (hash !== expected) return ok();

  const coins = Math.max(0, Math.round(amount_usd * USD_TO_COINS));
  if (coins <= 0) return ok();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!supabaseUrl || !serviceKey) return ok();

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  // 1) event insert (idempotent)
  const raw = Object.fromEntries(q.entries());
  const { error: insErr } = await supabase.from("offerwall_events").insert({
    provider: "cpx",
    trans_id,
    user_id: subid_1,
    status: Number(status),
    type,
    amount_usd,
    coins,
    raw,
  });

  // duplicate trans_id -> zaten işlendi
  if (insErr) return ok();

  // 2) balance increment (atomik)
  await supabase.rpc("increment_balance", { p_user_id: subid_1, p_delta: coins });

  return ok();
}

export async function POST(req: NextRequest) {
  return GET(req);
}
