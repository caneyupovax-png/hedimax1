import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function pick(params: Record<string, string>, keys: string[]) {
  for (const k of keys) {
    const v = (params[k] || "").trim();
    if (v) return v;
  }
  return "";
}

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

async function readAllParams(req: Request) {
  const url = new URL(req.url);
  const query = Object.fromEntries(url.searchParams.entries()) as Record<string, string>;

  if (req.method !== "POST") return query;

  const ct = (req.headers.get("content-type") || "").toLowerCase();
  try {
    if (ct.includes("application/json")) {
      const body = (await req.json()) as Record<string, any>;
      const b: Record<string, string> = {};
      for (const [k, v] of Object.entries(body)) b[k] = String(v);
      return { ...query, ...b };
    }

    if (ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")) {
      const fd = await req.formData();
      const b: Record<string, string> = {};
      fd.forEach((v, k) => (b[k] = String(v)));
      return { ...query, ...b };
    }
  } catch {
    // ignore
  }

  return query;
}

/**
 * NOTIK POSTBACK (robust)
 * - Credits points_balance.balance
 * - Accepts reward from: amount OR payout OR reward
 * - Always returns 200 (Notik panel fail göstermesin)
 */
async function handler(req: Request) {
  try {
    const params = await readAllParams(req);

    // 🔍 log: Vercel runtime logs’ta gözüksün
    console.log("NOTIK_IN", { url: req.url, params });

    const subId = pick(params, ["s1", "subId", "user_id", "sub_id"]);
    const transId = pick(params, ["transId", "txn_id", "transaction_id", "txnId"]);
    const rewardStr = pick(params, ["amount", "payout", "reward"]); // ✅ payout fallback eklendi
    const statusStr = pick(params, ["status"]); // bazen gelmez

    if (!subId || !rewardStr) return new NextResponse("OK:MISSING_PARAMS", { status: 200 });
    if (!isUuid(subId)) return new NextResponse("OK:INVALID_USER_ID", { status: 200 });

    const reward = Number(rewardStr);
    const status = Number(statusStr || "1"); // status yoksa 1 kabul

    if (!Number.isFinite(reward) || reward <= 0) return new NextResponse("OK:IGNORED_REWARD", { status: 200 });
    if (status !== 1) return new NextResponse("OK:IGNORED_STATUS", { status: 200 });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    if (!supabaseUrl || !serviceKey) return new NextResponse("OK:MISSING_ENV", { status: 200 });

    const admin: any = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // points_balance mevcut satırı çek
    const { data: row, error: selErr } = await admin
      .from("points_balance")
      .select("balance")
      .eq("user_id", subId)
      .maybeSingle();

    if (selErr) {
      console.log("NOTIK_BALANCE_SELECT_ERROR", selErr);
      return new NextResponse("OK:BALANCE_SELECT_ERROR", { status: 200 });
    }

    if (!row) {
      console.log("NOTIK_USER_BALANCE_NOT_FOUND", { subId, transId });
      return new NextResponse("OK:USER_BALANCE_NOT_FOUND", { status: 200 });
    }

    const next = Number(row.balance || 0) + reward;

    const { error: updErr } = await admin
      .from("points_balance")
      .update({ balance: next })
      .eq("user_id", subId);

    if (updErr) {
      console.log("NOTIK_BALANCE_UPDATE_ERROR", updErr);
      return new NextResponse("OK:BALANCE_UPDATE_ERROR", { status: 200 });
    }

    return new NextResponse("OK", { status: 200 });
  } catch (e) {
    console.log("NOTIK_SERVER_ERROR", e);
    return new NextResponse("OK:SERVER_ERROR", { status: 200 });
  }
}

export async function GET(req: Request) {
  return handler(req);
}

export async function POST(req: Request) {
  return handler(req);
}
