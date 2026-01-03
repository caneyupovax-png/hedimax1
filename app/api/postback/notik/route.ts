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

async function readParams(req: Request) {
  const url = new URL(req.url);
  const query = Object.fromEntries(url.searchParams.entries()) as Record<string, string>;
  return query;
}

export async function GET(req: Request) {
  try {
    const params = await readParams(req);

    // ✅ NOTIK’TE EN DOĞRUSU s1 (Sub ID)
    const s1 = pick(params, ["s1"]);
    const subIdParam = pick(params, ["subId"]);
    const userIdParam = pick(params, ["user_id"]);

    // Öncelik: s1 -> subId -> user_id
    const subId = s1 || subIdParam || userIdParam;

    const transId = pick(params, ["transId", "txn_id", "transaction_id"]);
    const rewardStr = pick(params, ["reward", "amount"]);
    const statusStr = pick(params, ["status"]) || "1";

    if (!subId || !transId || !rewardStr) {
      return new NextResponse("MISSING_PARAMS", { status: 400 });
    }

    // ✅ UUID kontrolü (artık “balance” gibi şeyler net yakalanır)
    if (!isUuid(subId)) {
      return new NextResponse(`INVALID_USER_ID ${subId}`, { status: 400 });
    }

    const reward = Number(rewardStr);
    const status = Number(statusStr);

    if (!Number.isFinite(reward) || reward <= 0) return new NextResponse("IGNORED_REWARD", { status: 200 });
    if (status !== 1) return new NextResponse("IGNORED_STATUS", { status: 200 });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    if (!supabaseUrl || !serviceKey) {
      return new NextResponse("MISSING_ENV", { status: 500 });
    }

    const admin: any = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // ✅ points_balance mevcut satırı al
    const sel = await (admin.from("points_balance") as any)
      .select("balance")
      .eq("user_id", subId)
      .maybeSingle();

    if (sel.error) {
      return new NextResponse(`BALANCE_SELECT_ERROR ${sel.error.message}`, { status: 500 });
    }
    if (!sel.data) {
      return new NextResponse("USER_BALANCE_NOT_FOUND", { status: 400 });
    }

    const current = Number(sel.data.balance ?? 0);
    const next = current + reward;

    const upd = await (admin.from("points_balance") as any)
      .update({ balance: next })
      .eq("user_id", subId);

    if (upd.error) {
      return new NextResponse(`BALANCE_UPDATE_ERROR ${upd.error.message}`, { status: 500 });
    }

    return new NextResponse("OK", { status: 200 });
  } catch (e: any) {
    console.log("NOTIK_SERVER_ERROR", e);
    return new NextResponse("SERVER_ERROR", { status: 500 });
  }
}
