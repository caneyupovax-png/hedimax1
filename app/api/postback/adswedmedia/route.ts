import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

function md5(input: string) {
  return crypto.createHash("md5").update(input).digest("hex");
}

async function getAndUpdatePointsBalance(
  admin: ReturnType<typeof createClient>,
  userId: string,
  delta: number
) {
  // We support two possible schemas for points_balance:
  // A) points_balance(user_id uuid, balance bigint)
  // B) points_balance(id uuid, balance bigint)

  // --- Try schema A: user_id ---
  {
    const sel = await admin
      .from("points_balance")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle();

    if (!sel.error) {
      const current = Number((sel.data as any)?.balance ?? 0);
      const next = current + delta;

      if (sel.data) {
        const upd = await admin
          .from("points_balance")
          .update({ balance: next })
          .eq("user_id", userId);

        if (upd.error) throw upd.error;
        return { schema: "user_id", before: current, after: next };
      } else {
        const ins = await admin
          .from("points_balance")
          .insert({ user_id: userId, balance: next });

        if (ins.error) throw ins.error;
        return { schema: "user_id", before: 0, after: next };
      }
    }

    // If error mentions missing column user_id, fall back to schema B
    const msg = String(sel.error?.message || "").toLowerCase();
    if (!(msg.includes("column") && msg.includes("user_id"))) {
      // Some other error (permissions, etc.)
      throw sel.error;
    }
  }

  // --- Try schema B: id ---
  {
    const sel = await admin
      .from("points_balance")
      .select("balance")
      .eq("id", userId)
      .maybeSingle();

    if (sel.error) throw sel.error;

    const current = Number((sel.data as any)?.balance ?? 0);
    const next = current + delta;

    if (sel.data) {
      const upd = await admin
        .from("points_balance")
        .update({ balance: next })
        .eq("id", userId);

      if (upd.error) throw upd.error;
      return { schema: "id", before: current, after: next };
    } else {
      const ins = await admin.from("points_balance").insert({ id: userId, balance: next });
      if (ins.error) throw ins.error;
      return { schema: "id", before: 0, after: next };
    }
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const subId = (searchParams.get("subId") || "").trim(); // user uuid
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

    // ✅ AdsWed signature rule (exact):
    // MD5(subId + transId + reward + secret)
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

    // --- CREDIT CALCULATION ---
    // Prefer round_reward > reward > payout*rate
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

    // 1) idempotency
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

    // 2) ✅ PRIMARY: write into points_balance table (this is what your Navbar reads)
    try {
      const res = await getAndUpdatePointsBalance(admin, subId, delta);
      console.log("ADSWED_POINTS_BALANCE_UPDATED", {
        subId,
        transId,
        delta,
        schema: res.schema,
        before: res.before,
        after: res.after,
      });
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
