import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * NOTIK POSTBACK (NO SIGNATURE)
 *
 * Supports both GET and POST.
 * Accepts params from either:
 * - our custom names: subId, transId, reward, status
 * - system names: user_id, txn_id, amount, status
 * - sometimes tracking: s1 (sub id)
 */

function pickFirst(obj: Record<string, any>, keys: string[]): string {
  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return String(v).trim();
  }
  return "";
}

async function readParams(req: Request): Promise<Record<string, string>> {
  const url = new URL(req.url);
  const query = Object.fromEntries(url.searchParams.entries());

  // If POST, merge JSON or form body (if any)
  if (req.method === "POST") {
    const ct = (req.headers.get("content-type") || "").toLowerCase();

    try {
      if (ct.includes("application/json")) {
        const body = (await req.json()) as Record<string, any>;
        return { ...query, ...Object.fromEntries(Object.entries(body).map(([k, v]) => [k, String(v)])) };
      }

      if (ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")) {
        const fd = await req.formData();
        const body: Record<string, string> = {};
        fd.forEach((v, k) => (body[k] = String(v)));
        return { ...query, ...body };
      }
    } catch {
      // ignore body parse errors; query params still work
    }
  }

  return query;
}

async function getAndUpdatePointsBalance(admin: any, userId: string, delta: number) {
  const pb: any = admin.from("points_balance");

  // Try schema A: points_balance(user_id, balance)
  const { data: rowA, error: errA } = await pb.select("balance").eq("user_id", userId).maybeSingle();
  if (!errA && rowA) {
    const current = Number(rowA.balance || 0);
    const { error: updErr } = await pb.update({ balance: current + delta }).eq("user_id", userId);
    if (updErr) throw updErr;
    return;
  }

  // Try schema B: points_balance(user_id, points)
  const { data: rowB, error: errB } = await pb.select("points").eq("user_id", userId).maybeSingle();
  if (!errB && rowB) {
    const current = Number(rowB.points || 0);
    const { error: updErr } = await pb.update({ points: current + delta }).eq("user_id", userId);
    if (updErr) throw updErr;
    return;
  }

  // Insert fallback (balance)
  const { error: insErr } = await pb.insert({ user_id: userId, balance: delta });
  if (insErr) throw insErr;
}

async function handler(req: Request) {
  try {
    const params = await readParams(req);

    // user id can come as: subId OR user_id OR s1
    const subId = pickFirst(params, ["subId", "user_id", "s1", "sub_id", "userid"]);

    // transaction id can come as: transId OR txn_id OR transaction_id
    const transId = pickFirst(params, ["transId", "txn_id", "transaction_id", "txnid"]);

    // reward can come as: reward OR amount
    const rewardStr = pickFirst(params, ["reward", "amount"]);

    // status: default to 1 (add)
    const statusStr = pickFirst(params, ["status"]);
    const status = Number(statusStr || "1");

    if (!subId || !transId || !rewardStr) {
      console.log("NOTIK_MISSING_PARAMS", { subId, transId, rewardStr, statusStr, params });
      return new NextResponse("MISSING_PARAMS", { status: 400 });
    }

    const reward = Number(rewardStr);
    if (!Number.isFinite(reward) || reward <= 0) {
      // Notik reversal tests might send negative; ignore by default
      console.log("NOTIK_IGNORED_REWARD", { rewardStr, reward, transId, subId });
      return new NextResponse("IGNORED_REWARD", { status: 200 });
    }

    // Only add on status=1 (most networks use 1=approved)
    if (status !== 1) {
      console.log("NOTIK_IGNORED_STATUS", { status, transId, subId });
      return new NextResponse("IGNORED_STATUS", { status: 200 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    if (!supabaseUrl || !serviceKey) {
      console.log("NOTIK_MISSING_ENV", { hasUrl: !!supabaseUrl, hasServiceKey: !!serviceKey });
      return new NextResponse("MISSING_ENV", { status: 500 });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // Duplicate check (don’t double-credit)
    try {
      const { data: existing, error: selErr } = await admin
        .from("offerwall_conversions")
        .select("id")
        .eq("provider", "notik")
        .eq("transaction_id", transId)
        .maybeSingle();

      if (!selErr && existing) {
        return new NextResponse("DUP", { status: 200 });
      }
    } catch (e) {
      // If table doesn't exist, don't block rewards
      console.log("NOTIK_DUP_CHECK_SKIPPED", e);
    }

    // Log conversion (best-effort; don't block rewards)
    try {
      await admin.from("offerwall_conversions").insert({
        provider: "notik",
        user_id: subId,
        transaction_id: transId,
        reward,
        raw: params,
      });
    } catch (e) {
      console.log("NOTIK_CONVERSION_LOG_FAILED", e);
    }

    // Update points_balance (this is the important part)
    try {
      await getAndUpdatePointsBalance(admin, subId, reward);
    } catch (e) {
      console.log("NOTIK_POINTS_BALANCE_FAILED", e);
      return new NextResponse("BALANCE_ERROR", { status: 500 });
    }

    return new NextResponse("OK", { status: 200 });
  } catch (e) {
    console.log("NOTIK_SERVER_ERROR", e);
    return new NextResponse("SERVER_ERROR", { status: 500 });
  }
}

export async function GET(req: Request) {
  return handler(req);
}

export async function POST(req: Request) {
  return handler(req);
}
