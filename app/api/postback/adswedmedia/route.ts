import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

function md5(input: string) {
  return crypto.createHash("md5").update(input).digest("hex");
}

async function syncPointsBalanceTable(
  admin: ReturnType<typeof createClient>,
  userId: string,
  newBalance: number
) {
  // 1) Try schema A: points_balance(id uuid, balance bigint)
  {
    const u = await admin
      .from("points_balance")
      .update({ balance: newBalance })
      .eq("id", userId);

    // If update worked (no error and at least one row matched), done
    if (!u.error) {
      // supabase-js doesn't always return rowcount; so we verify by selecting
      const v = await admin
        .from("points_balance")
        .select("balance")
        .eq("id", userId)
        .maybeSingle();

      if (!v.error && v.data && typeof (v.data as any).balance !== "undefined") return;
    }

    // If column doesn't exist, we'll fall through to schema B
    if (u.error && String(u.error.message || "").toLowerCase().includes("column") &&
        String(u.error.message || "").toLowerCase().includes("id")) {
      // fallthrough
    } else {
      // If row didn't exist, try insert
      const ins = await admin.from("points_balance").insert({ id: userId, balance: newBalance });
      if (!ins.error) return;

      // If insert failed because column id doesn't exist, fallthrough
      if (!(ins.error && String(ins.error.message || "").toLowerCase().includes("column") &&
            String(ins.error.message || "").toLowerCase().includes("id"))) {
        // other errors: keep going to schema B as fallback anyway
      }
    }
  }

  // 2) Try schema B: points_balance(user_id uuid, balance bigint)
  {
    const u = await admin
      .from("points_balance")
      .update({ balance: newBalance })
      .eq("user_id", userId);

    if (!u.error) {
      const v = await admin
        .from("points_balance")
        .select("balance")
        .eq("user_id", userId)
        .maybeSingle();

      if (!v.error && v.data && typeof (v.data as any).balance !== "undefined") return;
    }

    // try insert
    await admin.from("points_balance").insert({ user_id: userId, balance: newBalance });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const subId = (searchParams.get("subId") || "").trim();
    const transId = (searchParams.get("transId") || "").trim();
    const rewardStr = (searchParams.get("reward") || "").trim();
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

    // AdsWed signature rule: MD5(subId + transId + reward + secret)
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

    // reward sometimes can be 0; if it is 0, no credit would happen.
    // We'll compute credit using: round_reward > reward > payout*rate (if provided)
    const roundRewardStr = (searchParams.get("round_reward") || "").trim();
    const payoutStr = (searchParams.get("payout") || "").trim();

    const r = Number(rewardStr);
    const rr = roundRewardStr ? Number(roundRewardStr) : NaN;
    const p = payoutStr ? Number(payoutStr) : NaN;

    if (!Number.isFinite(r) || r < 0) return new NextResponse("ERROR: Invalid reward", { status: 400 });
    if (roundRewardStr && (!Number.isFinite(rr) || rr < 0))
      return new NextResponse("ERROR: Invalid round_reward", { status: 400 });
    if (payoutStr && (!Number.isFinite(p) || p < 0))
      return new NextResponse("ERROR: Invalid payout", { status: 400 });

    const rate = Number((process.env.ADSWED_USD_TO_POINTS || "1000").trim());
    if (!Number.isFinite(rate) || rate <= 0) {
      return new NextResponse("ERROR: Invalid ADSWED_USD_TO_POINTS", { status: 500 });
    }

    let creditBase = 0;
    if (Number.isFinite(rr) && rr > 0) creditBase = rr;
    else if (r > 0) creditBase = r;
    else if (Number.isFinite(p) && p > 0) creditBase = p * rate;
    else return new NextResponse("ERROR: Zero reward", { status: 400 });

    let credit = Math.round(creditBase);
    if (credit === 0 && creditBase > 0) credit = 1;

    const delta = status === 1 ? credit : -credit;
    const raw = Object.fromEntries(searchParams.entries());

    // 1) idempotency insert
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

    // 2) Update profiles via RPC (returns updated row count)
    const { data: updatedCount, error: rpcErr } = await admin.rpc("increment_points", {
      p_user_id: subId,
      p_delta: delta,
    });

    if (rpcErr) {
      console.log("ADSWED_RPC_FAILED", rpcErr);
      return new NextResponse("ERROR: Points update failed", { status: 500 });
    }

    if (!updatedCount || Number(updatedCount) < 1) {
      console.log("ADSWED_USER_NOT_FOUND", { subId, transId });
      return new NextResponse("ERROR: User not found", { status: 400 });
    }

    // 3) Read the NEW balance from profiles.points_balance and mirror into points_balance table
    const { data: prof, error: profErr } = await admin
      .from("profiles")
      .select("points_balance")
      .eq("id", subId)
      .maybeSingle();

    if (profErr || !prof) {
      console.log("ADSWED_PROFILE_READ_FAILED", profErr);
      return new NextResponse("ERROR: Profile read failed", { status: 500 });
    }

    const newBal = Number((prof as any).points_balance ?? 0);

    // mirror into points_balance (whatever schema exists)
    try {
      await syncPointsBalanceTable(admin, subId, newBal);
    } catch (e: any) {
      console.log("ADSWED_SYNC_POINTS_BALANCE_FAILED", e);
      // Not fatal to crediting, but if you want strictness, uncomment next line:
      // return new NextResponse("ERROR: Balance sync failed", { status: 500 });
    }

    return new NextResponse("OK", { status: 200 });
  } catch (e: any) {
    console.log("ADSWED_SERVER_ERROR", e);
    return new NextResponse("ERROR: Server error", { status: 500 });
  }
}
