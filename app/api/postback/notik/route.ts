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
 * NOTIK POSTBACK (minimal + guaranteed)
 * - No offerwall_conversions table needed.
 * - Credits points_balance.balance only.
 * - Always returns 200 so Notik won't show "failed".
 *
 * Expected:
 *  subId from s1/subId/user_id (must be UUID)
 *  reward from amount/reward (must be >0)
 *  status=1 to credit
 */
async function handler(req: Request) {
  try {
    const params = await readAllParams(req);

    const subId = pick(params, ["s1", "subId", "user_id", "sub_id"]);
    const transId = pick(params, ["transId", "txn_id", "transaction_id"]); // sadece debug amaçlı
    const rewardStr = pick(params, ["reward", "amount"]);
    const statusStr = pick(params, ["status"]) || "1";

    // Notik fail göstermesin diye hep 200 döndür
    if (!subId || !rewardStr) return new NextResponse("OK:MISSING_PARAMS", { status: 200 });
    if (!isUuid(subId)) return new NextResponse("OK:INVALID_USER_ID", { status: 200 });

    const reward = Number(rewardStr);
    const status = Number(statusStr);

    if (!Number.isFinite(reward) || reward <= 0) return new NextResponse("OK:IGNORED_REWARD", { status: 200 });
    if (status !== 1) return new NextResponse("OK:IGNORED_STATUS", { status: 200 });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    if (!supabaseUrl || !serviceKey) return new NextResponse("OK:MISSING_ENV", { status: 200 });

    const admin: any = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // points_balance mevcut satırı bul
    const { data: row, error: selErr } = await admin
      .from("points_balance")
      .select("balance")
      .eq("user_id", subId)
      .maybeSingle();

    if (selErr) {
      console.log("NOTIK_BALANCE_SELECT_ERROR", selErr, { subId, transId, rewardStr, statusStr, params });
      return new NextResponse("OK:BALANCE_SELECT_ERROR", { status: 200 });
    }
    if (!row) {
      console.log("NOTIK_USER_BALANCE_NOT_FOUND", { subId, transId, params });
      return new NextResponse("OK:USER_BALANCE_NOT_FOUND", { status: 200 });
    }

    const next = Number(row.balance || 0) + reward;

    const { error: updErr } = await admin
      .from("points_balance")
      .update({ balance: next })
      .eq("user_id", subId);

    if (updErr) {
      console.log("NOTIK_BALANCE_UPDATE_ERROR", updErr, { subId, transId, next, params });
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
