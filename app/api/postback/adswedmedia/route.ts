import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

function md5(input: string) {
  return crypto.createHash("md5").update(input).digest("hex");
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const subId = searchParams.get("subId") || "";      // user uuid
    const transId = searchParams.get("transId") || "";  // unique tx
    const rewardStr = searchParams.get("reward") || ""; // virtual currency (absolute)
    const statusStr = searchParams.get("status") || ""; // 1 add, 2 subtract
    const signature = (searchParams.get("signature") || "").toLowerCase();

    if (!subId || !transId || !rewardStr || !statusStr || !signature) {
      return new NextResponse("ERROR: Missing params", { status: 400 });
    }

    const reward = Number(rewardStr);
    const status = Number(statusStr);

    if (!Number.isFinite(reward) || reward < 0) {
      return new NextResponse("ERROR: Invalid reward", { status: 400 });
    }
    if (status !== 1 && status !== 2) {
      return new NextResponse("ERROR: Invalid status", { status: 400 });
    }

    const secret = process.env.ADSWED_SECRET || "";
    if (!secret) {
      // Secret yoksa güvenlik doğrulaması yapamayız
      return new NextResponse("ERROR: Missing secret", { status: 500 });
    }

    // ✅ AdsWedMedia signature rule:
    // MD5(SUBID + TRANSACTIONID + REWARD + SECRET)
    const expected = md5(`${subId}${transId}${rewardStr}${secret}`).toLowerCase();
    if (expected !== signature) {
      return new NextResponse("ERROR: Signature doesn't match", { status: 403 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    if (!supabaseUrl || !serviceKey) {
      return new NextResponse("ERROR: Missing supabase env", { status: 500 });
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // status=1 add, status=2 subtract (reward absolute geliyor)
    const delta = status === 1 ? Math.round(reward) : -Math.round(reward);

    // Idempotency: transId unique => duplicate olursa "DUP" dönmeliyiz
    const raw = Object.fromEntries(searchParams.entries());

    const { error: insErr } = await admin.from("adswed_postbacks").insert({
      trans_id: transId,
      user_id: subId, // uuid bekleniyor
      delta,
      reward,
      payout: searchParams.get("payout") ? Number(searchParams.get("payout")) : null,
      status,
      raw,
    });

    // Duplicate transaction => AdsWed "DUP" bekliyor
    if (insErr && String(insErr.message || "").toLowerCase().includes("duplicate")) {
      return new NextResponse("DUP", { status: 200 });
    }
    if (insErr) {
      return new NextResponse("ERROR: DB insert failed", { status: 500 });
    }

    // points_balance update (senin profiles.user_id uuid)
    const { error: rpcErr } = await admin.rpc("increment_points", {
      p_user_id: subId,
      p_delta: delta,
    });

    if (rpcErr) {
      return new NextResponse("ERROR: Points update failed", { status: 500 });
    }

    // ✅ New transaction => "OK"
    return new NextResponse("OK", { status: 200 });
  } catch (e: any) {
    return new NextResponse("ERROR: Server error", { status: 500 });
  }
}
