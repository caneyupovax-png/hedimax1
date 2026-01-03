import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

function pick(params: Record<string, string>, keys: string[]) {
  for (const k of keys) {
    const v = (params[k] || "").trim();
    if (v) return v;
  }
  return "";
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

async function handler(req: Request) {
  const params = await readAllParams(req);

  // Notik: best is s1 (Sub ID)
  const subId = pick(params, ["s1", "subId", "user_id", "sub_id"]);
  const transId = pick(params, ["transId", "txn_id", "transaction_id"]);
  const rewardStr = pick(params, ["reward", "amount"]);
  const statusStr = pick(params, ["status"]) || "1";

  if (!subId || !transId || !rewardStr) {
    return new NextResponse(
      `MISSING_PARAMS subId=${subId || "-"} transId=${transId || "-"} reward=${rewardStr || "-"}`,
      { status: 400 }
    );
  }

  if (!isUuid(subId)) {
    return new NextResponse(`INVALID_USER_ID ${subId}`, { status: 400 });
  }

  const reward = Number(rewardStr);
  const status = Number(statusStr);

  if (!Number.isFinite(reward) || reward <= 0) {
    return new NextResponse(`IGNORED_REWARD ${rewardStr}`, { status: 400 });
  }

  if (status !== 1) {
    return new NextResponse(`IGNORED_STATUS ${status}`, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!supabaseUrl || !serviceKey) {
    return new NextResponse("MISSING_ENV", { status: 500 });
  }

  const admin: any = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Duplicate check (hard-block, and return 409 so Notik won’t show Success)
  try {
    const { data: dup, error: dupErr } = await admin
      .from("offerwall_conversions")
      .select("id")
      .eq("provider", "notik")
      .eq("transaction_id", transId)
      .maybeSingle();

    if (!dupErr && dup) {
      return new NextResponse(`DUP ${transId}`, { status: 409 });
    }
  } catch {
    // if table missing, skip
  }

  // Update points_balance.balance
  const { data: row, error: selErr } = await admin
    .from("points_balance")
    .select("balance")
    .eq("user_id", subId)
    .maybeSingle();

  if (selErr) {
    return new NextResponse(`BALANCE_SELECT_ERROR ${selErr.message}`, { status: 500 });
  }
  if (!row) {
    return new NextResponse("USER_BALANCE_NOT_FOUND", { status: 400 });
  }

  const current = Number(row.balance || 0);
  const next = current + reward;

  const { error: updErr } = await admin
    .from("points_balance")
    .update({ balance: next })
    .eq("user_id", subId);

  if (updErr) {
    return new NextResponse(`BALANCE_UPDATE_ERROR ${updErr.message}`, { status: 500 });
  }

  // Log conversion (best-effort after balance succeeded)
  try {
    await admin.from("offerwall_conversions").insert({
      provider: "notik",
      user_id: subId,
      transaction_id: transId,
      reward,
      raw: params,
    });
  } catch {
    // ignore
  }

  return new NextResponse("OK", { status: 200 });
}

export async function GET(req: Request) {
  return handler(req);
}

export async function POST(req: Request) {
  return handler(req);
}
