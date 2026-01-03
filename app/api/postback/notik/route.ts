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

function parseStatus(statusStr: string | undefined | null) {
  // Notik testte "{status}" gibi literal gelebiliyor.
  // Eğer sayı değilse 1 kabul ediyoruz (approved).
  const raw = (statusStr || "").trim();
  if (!raw) return 1;
  const n = Number(raw);
  if (!Number.isFinite(n)) return 1;
  return n;
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

async function handler(req: Request) {
  try {
    const params = await readAllParams(req);

    // Log (istersen Vercel runtime logs'ta görürsün)
    console.log("NOTIK_IN", { url: req.url, params });

    // ✅ User id: Notik testte user_id dolu, s1/subId boş olabiliyor
    const subId = pick(params, ["s1", "subId", "user_id", "sub_id"]);

    // txn id (şu an sadece log amaçlı)
    const transId = pick(params, ["transId", "txn_id", "transaction_id", "txnId"]);

    // ✅ reward: amount veya reward geliyor (sende ikisi de geliyor)
    const rewardStr = pick(params, ["amount", "reward", "payout"]);

    // ✅ status: bozuk string gelirse 1 kabul
    const status = parseStatus(pick(params, ["status"]));

    // Notik panel fail göstermesin diye hep 200 dönüyoruz,
    // ama body ile ne olduğunu yazıyoruz.
    if (!subId || !rewardStr) return new NextResponse("OK:MISSING_PARAMS", { status: 200 });
    if (!isUuid(subId)) return new NextResponse(`OK:INVALID_USER_ID:${subId}`, { status: 200 });

    const reward = Number(rewardStr);
    if (!Number.isFinite(reward) || reward <= 0) return new NextResponse("OK:IGNORED_REWARD", { status: 200 });

    // status 1 değilse kredi yok (ama senin testte status bozuk geldiği için artık 1 kabul ediyoruz)
    if (status !== 1) return new NextResponse(`OK:IGNORED_STATUS:${status}`, { status: 200 });

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
      console.log("NOTIK_BALANCE_SELECT_ERROR", selErr, { subId, transId });
      return new NextResponse("OK:BALANCE_SELECT_ERROR", { status: 200 });
    }

    if (!row) {
      console.log("NOTIK_USER_BALANCE
