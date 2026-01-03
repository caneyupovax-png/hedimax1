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

async function handler(req: Request) {
  try {
    const params = await readAllParams(req);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const admin: any =
      supabaseUrl && serviceKey
        ? createClient(supabaseUrl, serviceKey, {
            auth: { persistSession: false, autoRefreshToken: false },
          })
        : null;

    // ✅ 1) DEBUG: Notik tam olarak ne gönderiyor? Supabase’e yaz.
    if (admin) {
      try {
        await admin.from("postback_debug").insert({
          provider: "notik",
          raw: params,
        });
      } catch (e) {
        // debug insert fail olsa bile devam
        console.log("POSTBACK_DEBUG_INSERT_FAILED", e);
      }
    }

    // ✅ 2) Parametreleri en esnek şekilde oku
    const subId = pick(params, ["s1", "subId", "user_id", "sub_id"]);
    const transId = pick(params, ["transId", "txn_id", "transaction_id", "txnId"]);
    const rewardStr = pick(params, ["amount", "reward", "payout"]);
    const statusStr = pick(params, ["status"]); // bazen gelmez

    if (!subId || !rewardStr) return new NextResponse("MISSING_PARAMS", { status: 200 });
    if (!isUuid(subId)) return new NextResponse(`INVALID_USER_ID:${subId}`, { status: 200 });

    const reward = Number(rewardStr);
    const status = Number(statusStr || "1"); // status yoksa 1 kabul

    if (!Number.isFinite(reward) || reward <= 0) return new NextResponse(`IGNORED_REWARD:${rewardStr}`, { status: 200 });
    if (status !== 1) return new NextResponse(`IGNORED_STATUS:${statusStr || "-"}`, { status: 200 });

    if (!admin) return new NextResponse("MISSING_ENV", { status: 200 });

    // ✅ 3) points_balance.balance artır
    const { data: row, error: selErr } = await admin
      .from("points_balance")
      .select("balance")
      .eq("user_id", subId)
      .maybeSingle();

    if (selErr) return new NextResponse(`BALANCE_SELECT_ERROR:${selErr.message}`, { status: 200 });
    if (!row) return new NextResponse("USER_BALANCE_NOT_FOUND", { status: 200 });

    const next = Number(row.balance || 0) + reward;

    const { error: updErr } = await admin
      .from("points_balance")
      .update({ balance: next })
      .eq("user_id", subId);

    if (updErr) return new NextResponse(`BALANCE_UPDATE_ERROR:${updErr.message}`, { status: 200 });

    return new NextResponse("OK", { status: 200 });
  } catch (e: any) {
    console.log("NOTIK_SERVER_ERROR", e);
    return new NextResponse("SERVER_ERROR", { status: 200 });
  }
}

export async function GET(req: Request) {
  return handler(req);
}

export async function POST(req: Request) {
  return handler(req);
}
