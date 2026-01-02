import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

function md5(input: string) {
  return crypto.createHash("md5").update(input).digest("hex");
}

type AnySB = ReturnType<typeof createClient>;

async function getAndUpdatePointsBalance(admin: AnySB, userId: string, delta: number) {
  // IMPORTANT:
  // Some supabase-js type setups require 2 generics for from<T, R>.
  // To avoid TypeScript build errors, we cast the table name and builder to any.
  const pb = (admin.from("points_balance" as any) as any);

  // 1) Try schema A: points_balance(user_id uuid, balance bigint)
  {
    const sel = await pb.select("balance").eq("user_id", userId).maybeSingle();

    if (!sel.error) {
      const current = Number(sel.data?.balance ?? 0);
      const next = current + delta;

      if (sel.data) {
        const upd = await pb.update({ balance: next }).eq("user_id", userId);
        if (upd.error) throw upd.error;
        return { schema: "user_id", before: current, after: next };
      } else {
        const ins = await pb.insert({ user_id: userId, balance: next });
        if (ins.error) throw ins.error;
        return { schema: "user_id", before: 0, after: next };
      }
    }

    const msg = String(sel.error?.message || "").toLowerCase();
    // If missing column user_id => fallback to schema B
    if (!(msg.includes("column") && msg.includes("user_id"))) {
      throw sel.error;
    }
  }

  // 2) Try schema B: points_balance(id uuid, balance bigint)
  {
    const sel = await pb.select("balance").eq("id", userId).maybeSingle();
    if (sel.error) throw sel.error;

    const current = Number(sel.data?.balance ?? 0);
    const next = current + delta;

    if (sel.data) {
      const upd = await pb.update({ balance: next }).eq("id", userId);
      if (upd.error) throw upd.error;
      return { schema: "id", before: current, after: next };
    } else {
      const ins = await pb.insert({ id: userId, balance: next });
      if (ins.error) throw ins.error;
      return { schema: "id", before: 0, after: next };
    }
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const subId = (searchParams.get("subId") || "").trim();
    const transId = (searchParams.get("transId") || "").trim();
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

    // ✅ AdsWed signature: MD5(subId + transId + reward + secret)
    const expectedSig = md5(`${subId}${transId}${rewardStr}${secret}`).toLowerCase();
    if (expectedSig !== signature) {
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

    // CREDIT CALCULATION: round_reward > reward > payout*rate
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

    // 1) idempotency (duplicate => DUP)
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

    // 2) ✅ update points_balance table (Navbar reads this)
    try {
      await getAndUpdatePointsBalance(admin, subId, delta);
    } catch (e: any) {
      console.log("ADSWED_POINTS_BALANCE_FAILED", e);
      return new NextResponse("ERROR: points_balance update failed", { status: 500 });
    }

    return new NextResponse("OK", { status: 200 });
  } catch (e: any) {
    console.log("ADSWED_SERVER_ERROR", e);
    return new NextResponse("ERROR: Server error", { status: 500 });
  }
}
