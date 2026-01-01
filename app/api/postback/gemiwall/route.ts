import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function toInt(v: any) {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? Math.floor(n) : null;
}

function pick(obj: any, keys: string[]) {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && String(v) !== "") return v;
  }
  return null;
}

async function handle(req: Request) {
  const url = new URL(req.url);

  // Query params
  const q: Record<string, any> = {};
  url.searchParams.forEach((v, k) => (q[k] = v));

  // Body params (if POST)
  let body: any = {};
  if (req.method === "POST") {
    const ct = req.headers.get("content-type") || "";
    try {
      if (ct.includes("application/json")) body = await req.json();
      else if (ct.includes("application/x-www-form-urlencoded")) {
        const txt = await req.text();
        const sp = new URLSearchParams(txt);
        sp.forEach((v, k) => (body[k] = v));
      }
    } catch {}
  }

  // Merge (body wins)
  const p = { ...q, ...body };

  const userId = String(
    pick(p, ["user_id", "userId", "USER_ID", "userid", "uid", "sub_id", "subId"]) || ""
  );

  // Reward / amount
  const amountRaw = pick(p, [
    "amount",
    "reward",
    "Reward",
    "REWARD",
    "virtual_currency",
    "virtualCurrency",
    "coins",
    "points",
    "vc",
  ]);
  const amount = toInt(amountRaw);

  const txid = String(
    pick(p, ["transaction_id", "transactionId", "TRANSACTION_ID", "txid", "event_id", "eventId", "click_id"]) || ""
  );

  const status = String(pick(p, ["status", "Status"]) || "");

  // Often tests send status = Completed; we accept empty too
  if (!userId || amount === null || amount <= 0) {
    return NextResponse.json(
      { ok: false, error: "bad_request", userId, amount, txid, status, received: p },
      { status: 400 }
    );
  }

  // ✅ Update points_balance by user_id
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

  // ✅ Return plain OK too (some providers require 200 OK only)
  return NextResponse.json({ ok: true, user_id: userId, added: amount, balance: next, txid, status });
}

export async function GET(req: Request) {
  return handle(req);
}

export async function POST(req: Request) {
  return handle(req);
}
