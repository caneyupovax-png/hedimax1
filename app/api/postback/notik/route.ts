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
    // ignore body parse errors
  }

  return query;
}

/**
 * IMPORTANT:
 * - Always return 200 OK to Notik (no more 400/409).
 * - Only credit when params are valid and status=1 and reward>0.
 * - Duplicate txn_id will NOT credit again, but still returns 200.
 */
async function handler(req: Request) {
  try {
    const params = await readAllParams(req);

    // Prefer s1 (Notik Sub ID) -> subId -> user_id
    const subId = pick(params, ["s1", "subId", "user_id", "sub_id"]);
    const transId = pick(params, ["transId", "txn_id", "transaction_id"]);
    const rewardStr = pick(params, ["reward", "amount"]);
    const statusStr = pick(params, ["status"]);
    const status = Number(statusStr || "1");
    const reward = Number(rewardStr || "0");

    // Always 200, but tell reason in body
    if (!subId || !transId || !rewardStr) {
      return new NextResponse("OK:MISSING_PARAMS", { status: 200 });
    }

    if (!isUuid(subId)) {
      return new NextResponse("OK:INVALID_USER_ID", { status: 200 });
    }

    if (!Number.isFinite(reward) || reward <= 0) {
      return new NextResponse("OK:IGNORED_REWARD", { status: 200 });
    }

    if (status !== 1) {
      return new NextResponse("OK:IGNORED_STATUS", { status: 200 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    if (!supabaseUrl || !serviceKey) {
      return new NextResponse("OK:MISSING_ENV", { status: 200 });
    }

    const admin: any = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Duplicate check (no double credit)
    try {
      const { data: dup, error: dupErr } = await admin
        .from("offerwall_conversions")
        .select("id")
        .eq("provider", "notik")
        .eq("transaction_id", transId)
        .maybeSingle();

      if (!dupErr && dup) {
        return new NextResponse("OK:DUP", { status: 200 });
      }
    } catch {
      // if table doesn't exist, skip duplicate check
    }

    // Get current balance
    const { data: row, error: selErr } = await admin
      .from("points_balance")
      .select("balance")
      .eq("user_id", subId)
      .maybeSingle();

    if (selErr) {
      // Still return 200 so Notik doesn't fail; you can see this in Vercel logs if needed
      console.log("NOTIK_BALANCE_SELECT_ERROR", selErr);
      return new NextResponse("OK:BALANCE_SELECT_ERROR", { status: 200 });
    }

    if (!row) {
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

    // Log conversion best-effort
    try {
      await admin.from("offerwall_conversions").insert({
        provider: "notik",
        user_id: subId,
        transaction_id: transId,
        reward,
        raw: params,
      });
    } catch (e) {
      console.log("NOTIK_LOG_INSERT_FAILED", e);
      // do not fail
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
