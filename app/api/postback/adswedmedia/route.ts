import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

function md5(input: string) {
  return crypto.createHash("md5").update(input).digest("hex");
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    // Required
    const subId = searchParams.get("subId") || "";
    const transId = searchParams.get("transId") || "";
    const rewardStr = searchParams.get("reward") || "";
    const roundRewardStr = searchParams.get("round_reward") || "";
    const statusStr = searchParams.get("status") || "";
    const signature = (searchParams.get("signature") || "").toLowerCase();

    // Optional (we store in raw)
    const payoutStr = searchParams.get("payout") || "";

    if (!subId || !transId || !rewardStr || !statusStr || !signature) {
      return new NextResponse("ERROR: Missing params", { status: 400 });
    }

    // Validate numeric basics (reward absolute)
    const reward = Number(rewardStr);
    const status = Number(statusStr);

    if (!Number.isFinite(reward) || reward < 0) {
      return new NextResponse("ERROR: Invalid reward", { status: 400 });
    }
    if (status !== 1 && status !== 2) {
      return new NextResponse("ERROR: Invalid status", { status: 400 });
    }

    // Signature verification (AdsWedMedia official):
    // signature == MD5(subId + transId + reward + secret)
    // NOTE: some tester setups may send signature based on round_reward formatting;
    // we accept both reward and round_reward to avoid format mismatches.
    const secret = (process.env.ADSWED_SECRET || "").trim();
    if (!secret) {
      return new NextResponse("ERROR: Missing secret", { status: 500 });
    }

    const expected1 = md5(`${subId}${transId}${rewardStr}${secret}`).toLowerCase();
    const expected2 = roundRewardStr
      ? md5(`${subId}${transId}${roundRewardStr}${secret}`).toLowerCase()
      : "";

    if (signature !== expected1 && (!expected2 || signature !== expected2)) {
      // Log for debugging in Vercel Functions logs
      console.log("ADSWED_SIG_MISMATCH", {
        subId,
        transId,
        rewardStr,
        roundRewardStr,
        payoutStr,
        got: signature,
        expected1,
        expected2,
      });
      return new NextResponse("ERROR: Signature doesn't match", { status: 403 });
    }

    // Supabase admin client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    if (!supabaseUrl || !serviceKey) {
      return new NextResponse("ERROR: Missing supabase env", { status: 500 });
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // status: 1 add, 2 subtract (reward absolute)
    const delta = status === 1 ? Math.round(reward) : -Math.round(reward);

    // Idempotency: store tx (trans_id unique)
    const raw = Object.fromEntries(searchParams.entries());
    const payout = payoutStr ? Number(payoutStr) : null;

    const { error: insErr } = await admin.from("adswed_postbacks").insert({
      trans_id: transId,
      user_id: subId, // profiles.id (uuid)
      delta,
      reward,
      payout,
      status,
      raw,
    });

    // Duplicate transaction => AdsWed expects "DUP"
    if (insErr && String(insErr.message || "").toLowerCase().includes("duplicate")) {
      return new NextResponse("DUP", { status: 200 });
    }
    if (insErr) {
      console.log("ADSWED_DB_INSERT_FAILED", insErr);
      return new NextResponse("ERROR: DB insert failed", { status: 500 });
    }

    // Update user points (profiles.points, where id=subId)
    const { error: rpcErr } = await admin.rpc("increment_points", {
      p_user_id: subId,
      p_delta: delta,
    });

    if (rpcErr) {
      console.log("ADSWED_RPC_FAILED", rpcErr);
      return new NextResponse("ERROR: Points update failed", { status: 500 });
    }

    // New transaction => AdsWed expects "OK"
    return new NextResponse("OK", { status: 200 });
  } catch (e: any) {
    console.log("ADSWED_SERVER_ERROR", e);
    return new NextResponse("ERROR: Server error", { status: 500 });
  }
}
