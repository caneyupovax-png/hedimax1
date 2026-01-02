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
    const rewardStr = searchParams.get("reward") || "";
    const roundRewardStr = searchParams.get("round_reward") || "";
    const statusStr = searchParams.get("status") || "";
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

    const secret = (process.env.ADSWED_SECRET || "").trim();
    if (!secret) {
      return new NextResponse("ERROR: Missing secret", { status: 500 });
    }

    // AdsWed rule: MD5(subId + transId + reward + secret)
    // Bazı durumlarda signature round_reward ile üretilmiş olabiliyor, fallback ekledik.
    const expected1 = md5(`${subId}${transId}${rewardStr}${secret}`).toLowerCase();
    const expected2 = roundRewardStr
      ? md5(`${subId}${transId}${roundRewardStr}${secret}`).toLowerCase()
      : "";

    if (signature !== expected1 && (!expected2 || signature !== expected2)) {
      // Debug için Vercel logs'a düşer
      console.log("adswed sig mismatch", {
        subId,
        transId,
        rewardStr,
        roundRewardStr,
        got: signature,
        expected1,
        expected2,
      });
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

    // status=1 add, status=2 subtract (reward absolute)
    const delta = status === 1 ? Math.round(reward) : -Math.round(reward);

    // idempotency store
    const raw = Object.fromEntries(searchParams.entries());

    const { error: insErr } = await admin.from("adswed_postbacks").insert({
      trans_id: transId,
      user_id: subId, // profiles.id uuid
      delta,
      reward,
      payout: searchParams.get("payout") ? Number(searchParams.get("payout")) : null,
      status,
      raw,
    });

    // Duplicate => "DUP" (AdsWed expects this)
    if (insErr && String(insErr.message || "").toLowerCase().includes("duplicate")) {
      return new NextResponse("DUP", { status: 200 });
    }
    if (insErr) {
      console.log("adswed db insert failed", insErr);
      return new NextResponse("ERROR: DB insert failed", { status: 500 });
    }

    // Update points (profiles.points, where id=subId)
    const { error: rpcErr } = await admin.rpc("increment_points", {
      p_user_id: subId,
      p_delta: delta,
    });

    if (rpcErr) {
      console.log("adswed rpc failed", rpcErr);
      return new NextResponse("ERROR: Points update failed", { status: 500 });
    }

    return new NextResponse("OK", { status: 200 });
  } catch (e: any) {
    console.log("adswed server error", e);
    return new NextResponse("ERROR: Server error", { status: 500 });
  }
}
