import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function pick(params: Record<string, string>, keys: string[]) {
  for (const k of keys) {
    const v = params[k];
    if (v && v.trim() !== "") return v.trim();
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
    // ignore parse errors
  }

  return query;
}

async function handler(req: Request) {
  const params = await readAllParams(req);

  // User id comes in different names
  const userId = pick(params, ["subId", "user_id", "s1", "sub_id"]);
  const transId = pick(params, ["transId", "txn_id", "transaction_id", "txnId"]);
  const rewardStr = pick(params, ["reward", "amount"]);
  const statusStr = pick(params, ["status"]);

  if (!userId || !transId || !rewardStr) {
    return new NextResponse(
      `MISSING_PARAMS userId=${userId || "-"} transId=${transId || "-"} reward=${rewardStr || "-"}`,
      { status: 400 }
    );
  }

  const reward = Number(rewardStr);
  const status = Number(statusStr || "1");

  if (!Number.isFinite(reward) || reward <= 0) return new NextResponse("IGNORED_REWARD", { status: 200 });
  if (status !== 1) return new NextResponse("IGNORED_STATUS", { status: 200 });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  // 🔥 This is the #1 cause on Vercel
  if (!supabaseUrl || !serviceKey) {
    return new NextResponse(
      `MISSING_ENV url=${supabaseUrl ? "ok" : "missing"} service_role=${serviceKey ? "ok" : "missing"}`,
      { status: 500 }
    );
  }

  const admin = createClient(supabaseUrl, serviceKey);

  // Duplicate check (best-effort; if table not exists, continue)
  try {
    const { data: dup, error: dupErr } = await admin
      .from("offerwall_conversions")
      .select("id")
      .eq("provider", "notik")
      .eq("transaction_id", transId)
      .maybeSingle();

    if (!dupErr && dup) return new NextResponse("DUP", { status: 200 });
  } catch {
    // ignore
  }

  // Log conversion (best-effort; do NOT block balance update)
  try {
    await admin.from("offerwall_conversions").insert({
      provider: "notik",
      user_id: userId,
      transaction_id: transId,
      reward,
      raw: params,
    });
  } catch {
    // ignore
  }

  // ✅ Update points_balance.balance
  const { data: row, error: selErr } = await admin
    .from("points_balance")
    .select("balance")
    .eq("user_id", userId)
    .maybeSingle();

  if (selErr) {
    return new NextResponse(`BALANCE_SELECT_ERROR ${selErr.message}`, { status: 500 });
  }
  if (!row) {
    return new NextResponse("USER_BALANCE_NOT_FOUND", { status: 400 });
  }

  const newBalance = Number(row.balance || 0) + reward;

  const { error: updErr } = await admin
    .from("points_balance")
    .update({ balance: newBalance })
    .eq("user_id", userId);

  if (updErr) {
    // 👇 This message will tell us exactly what's wrong (permission/rls/etc.)
    return new NextResponse(`BALANCE_UPDATE_ERROR ${updErr.message}`, { status: 500 });
  }

  return new NextResponse("OK", { status: 200 });
}

export async function GET(req: Request) {
  return handler(req);
}

export async function POST(req: Request) {
  return handler(req);
}
