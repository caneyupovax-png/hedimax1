import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

function md5(input: string) {
  return crypto.createHash("md5").update(input).digest("hex");
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const subId = searchParams.get("subId") || "";
    const transId = searchParams.get("transId") || "";
    const rewardStr = (searchParams.get("reward") || "").trim();
    const roundRewardStr = (searchParams.get("round_reward") || "").trim();
    const payoutStr = (searchParams.get("payout") || "").trim();
    const statusStr = (searchParams.get("status") || "").trim();
    const signature = (searchParams.get("signature") || "").toLowerCase();

    if (!subId || !transId || !rewardStr || !statusStr || !signature) {
      return new NextResponse("ERROR: Missing params", { status: 400 });
    }

    const status = Number(statusStr);
    if (status !== 1 && status !== 2) {
      return new NextResponse("ERROR: Invalid status", { status: 400 });
    }

    const secret = (process.env.ADSWED_SECRET || "").trim();
    if (!secret) {
      return new NextResponse("ERROR: Missing secret", { status: 500 });
    }

    // ✅ AdsWed signature rule (exact):
    // MD5(subId + transId + reward + secret)
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

    // --- CREDIT CALCULATION ---
    // Prefer round_reward > reward
    const rr = roundRewardStr ? Number(roundRewardStr) : NaN;
    const r = Number(rewardStr);
    const p = payoutStr ? Number(payoutStr) : NaN;

    if (!Number.isFinite(r) || r < 0) {
      return new NextResponse("ERROR: Invalid reward", { status: 400 });
    }
    if (roundRewardStr && (!Number.isFinite(rr) || rr < 0)) {
      return new NextResponse("ERROR: Invalid round_reward", { status: 400 });
    }
    if (payoutStr && (!Number.isFinite(p) || p < 0)) {
      return new NextResponse("ERROR: Invalid payout", { status: 400 });
    }

    // 1) Use round_reward if > 0
    // 2) else use reward if > 0
    // 3) else compute from payout * rate
    const rate = Number((process.env.ADSWED_USD_TO_POINTS || "1000").trim()); // default 1000
    if (!Number.isFinite(rate) || rate <= 0) {
      return new NextResponse("ERROR: Invalid ADSWED_USD_TO_POINTS", { status: 500 });
    }

    let creditBase = 0;

    if (Number.isFinite(rr) && rr > 0) {
      creditBase = rr;
    } else if (r > 0) {
      creditBase = r;
    } else if (Number.isFinite(p) && p > 0) {
      creditBase = p * rate;
    } else {
      // reward=0 and payout missing/0 => nothing to credit
      console.log("ADSWED_ZERO_REWARD", { subId, transId, rewardStr, roundRewardStr, payoutStr });
      return new NextResponse("ERROR: Zero reward", { status: 400 });
    }

    // points is integer => round to int, but never 0 if creditBase > 0
    let credit = Math.round(creditBase);
    if (credit === 0 && creditBase > 0) credit = 1;

    const delta = status === 1 ? credit : -credit;

    // Ensure user exists
    const { data: profileRow, error: profErr } = await admin
      .from("profiles")
      .select("id, points")
      .eq("id", subId)
      .maybeSingle();

    if (profErr) {
      console.log("ADSWED_PROFILE_LOOKUP_FAILED", profErr);
      return new NextResponse("ERROR: Profile lookup failed", { status: 500 });
    }
    if (!profileRow) {
      console.log("ADSWED_USER_NOT_FOUND", { subId, transId });
      return new NextResponse("ERROR: User not found", { status: 400 });
    }

    // Idempotency store
    const raw = Object.fromEntries(searchParams.entries());

    const { error: insErr } = await admin.from("adswed_postbacks").insert({
      trans_id: transId,
      user_id: subId,
      delta,
      reward: r,
      payout: payoutStr ? Number(payoutStr) : null,
      status,
      raw,
    });

    if (insErr && String(insErr.message || "").toLowerCase().includes("duplicate")) {
      return new NextResponse("DUP", { status: 200 });
    }
    if (insErr) {
      console.log("ADSWED_DB_INSERT_FAILED", insErr);
      return new NextResponse("ERROR: DB insert failed", { status: 500 });
    }

    // Update points (increment_points returns updated row count integer)
    const { data: updatedCount, error: rpcErr } = await admin.rpc("increment_points", {
      p_user_id: subId,
      p_delta: delta,
    });

    if (rpcErr) {
      console.log("ADSWED_RPC_FAILED", rpcErr);
      return new NextResponse("ERROR: Points update failed", { status: 500 });
    }
    if (!updatedCount || Number(updatedCount) < 1) {
      console.log("ADSWED_POINTS_NOT_UPDATED", { subId, transId, delta, updatedCount });
      return new NextResponse("ERROR: Points not updated", { status: 500 });
    }

    console.log("ADSWED_OK", {
      subId,
      transId,
      status,
      rewardStr,
      roundRewardStr,
      payoutStr,
      rate,
      creditBase,
      credit,
      delta,
      before: profileRow.points,
    });

    return new NextResponse("OK", { status: 200 });
  } catch (e: any) {
    console.log("ADSWED_SERVER_ERROR", e);
    return new NextResponse("ERROR: Server error", { status: 500 });
  }
}
