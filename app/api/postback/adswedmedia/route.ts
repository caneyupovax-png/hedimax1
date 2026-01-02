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

    // signature == MD5(subId + transId + reward + secret)
    const expected1 = md5(`${subId}${transId}${rewardStr}${secret}`).toLowerCase();
    const expected2 = roundRewardStr
      ? md5(`${subId}${transId}${roundRewardStr}${secret}`).toLowerCase()
      : "";

    if (signature !== expected1 && (!expected2 || signature !== expected2)) {
      console.log("ADSWED_SIG_MISMATCH", {
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

    // 1) Önce kullanıcı gerçekten var mı kontrol et (yoksa puan yazamaz)
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

    const delta = status === 1 ? Math.round(reward) : -Math.round(reward);
    const raw = Object.fromEntries(searchParams.entries());

    // 2) Idempotency insert (duplicate => DUP)
    const { error: insErr } = await admin.from("adswed_postbacks").insert({
      trans_id: transId,
      user_id: subId,
      delta,
      reward,
      payout: searchParams.get("payout") ? Number(searchParams.get("payout")) : null,
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

    // 3) RPC ile puan güncelle (updated_count döndürmeli)
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

    // 4) Son kontrol: points gerçekten artmış mı?
    const { data: verifyRow, error: verErr } = await admin
      .from("profiles")
      .select("id, points")
      .eq("id", subId)
      .maybeSingle();

    if (verErr) {
      console.log("ADSWED_VERIFY_FAILED", verErr);
      return new NextResponse("ERROR: Verify failed", { status: 500 });
    }

    console.log("ADSWED_OK", {
      subId,
      transId,
      delta,
      before: profileRow.points,
      after: verifyRow?.points,
    });

    return new NextResponse("OK", { status: 200 });
  } catch (e: any) {
    console.log("ADSWED_SERVER_ERROR", e);
    return new NextResponse("ERROR: Server error", { status: 500 });
  }
}
